import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import {
  SubscribeNewsletterDto,
  UnsubscribeNewsletterDto,
  SendCampaignDto,
} from './dto/create-newsletter.dto';
import { CampaignStatus } from '@prisma/client';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Subscribe to newsletter
   */
  async subscribe(dto: SubscribeNewsletterDto) {
    // Check if email already exists
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('This email is already subscribed');
      }

      // Reactivate subscription
      const subscriber = await this.prisma.newsletterSubscriber.update({
        where: { email: dto.email },
        data: {
          isActive: true,
          name: dto.name || existing.name,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          source: dto.source || existing.source,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      });

      // Log activity
      await this.prisma.newsletterActivity.create({
        data: {
          email: dto.email,
          action: 'resubscribed',
          details: `Resubscribed from ${dto.source || 'unknown'}`,
        },
      });

      // Send welcome email
      await this.emailService.sendNewsletterWelcome(
        subscriber.email,
        subscriber.name ?? undefined,
      );

      this.logger.log(`Reactivated subscription: ${dto.email}`);

      return {
        success: true,
        message: 'Successfully resubscribed to newsletter!',
      };
    }

    // Create new subscriber
    const subscriber = await this.prisma.newsletterSubscriber.create({
      data: {
        email: dto.email,
        name: dto.name,
        source: dto.source || 'homepage_modal',
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });

    // Log activity
    await this.prisma.newsletterActivity.create({
      data: {
        email: dto.email,
        action: 'subscribed',
        details: `Subscribed from ${dto.source || 'homepage_modal'}`,
      },
    });

    // Send welcome email
    await this.emailService.sendNewsletterWelcome(
      subscriber.email,
      subscriber.name ?? undefined,
    );

    this.logger.log(`New subscription: ${dto.email}`);

    return {
      success: true,
      message: 'Successfully subscribed to newsletter!',
    };
  }

  /**
   * Unsubscribe from newsletter
   */
  async unsubscribe(dto: UnsubscribeNewsletterDto) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email },
    });

    if (!subscriber) {
      throw new NotFoundException('Email not found in our subscription list');
    }

    if (!subscriber.isActive) {
      return {
        success: true,
        message: 'You are already unsubscribed',
      };
    }

    // Soft delete - mark as inactive
    await this.prisma.newsletterSubscriber.update({
      where: { email: dto.email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    // Log activity
    await this.prisma.newsletterActivity.create({
      data: {
        email: dto.email,
        action: 'unsubscribed',
      },
    });

    this.logger.log(`Unsubscribed: ${dto.email}`);

    return {
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    };
  }

  /**
   * Get all active subscribers (admin only)
   */
  async getAllSubscribers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [subscribers, total, active, inactive] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        where: { isActive: true },
        orderBy: { subscribedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          subscribedAt: true,
          source: true,
          createdAt: true,
        },
      }),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      this.prisma.newsletterSubscriber.count({ where: { isActive: false } }),
    ]);

    return {
      subscribers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        active,
        inactive,
        total: active + inactive,
      },
    };
  }

  /**
   * Get subscriber statistics (admin only)
   */
  async getStatistics() {
    const [totalActive, totalInactive, recentSubscribers] = await Promise.all([
      this.prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),
      this.prisma.newsletterSubscriber.count({
        where: { isActive: false },
      }),
      this.prisma.newsletterSubscriber.count({
        where: {
          isActive: true,
          subscribedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalActive,
      totalInactive,
      recentSubscribers,
      total: totalActive + totalInactive,
    };
  }

  /**
   * Export subscribers to CSV (admin only)
   */
  async exportToCsv(): Promise<string> {
    const subscribers = await this.prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      orderBy: { subscribedAt: 'desc' },
    });

    // Create CSV
    const headers = ['Email', 'Name', 'Subscribed At', 'Source'];
    const rows = subscribers.map((s) => [
      s.email,
      s.name || '',
      s.subscribedAt.toISOString(),
      s.source || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return csv;
  }

  /**
   * Send campaign to all subscribers (admin only)
   */
  async sendCampaign(dto: SendCampaignDto, userId: string) {
    // Get all active subscribers
    const subscribers = await this.prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true, name: true },
    });

    if (subscribers.length === 0) {
      throw new NotFoundException('No active subscribers found');
    }

    // Create campaign record
    const campaign = await this.prisma.newsletterCampaign.create({
      data: {
        subject: dto.subject,
        content: dto.content,
        status: CampaignStatus.SENDING,
        totalRecipients: subscribers.length,
        sentBy: userId,
      },
    });

    // Send emails
    const results = await this.emailService.sendNewsletterCampaign(
      subscribers,
      dto.subject,
      dto.content,
    );

    // Update campaign status
    const finalStatus =
      results.failedCount === 0
        ? CampaignStatus.SENT
        : results.sentCount === 0
          ? CampaignStatus.FAILED
          : CampaignStatus.PARTIALLY_SENT;

    await this.prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status: finalStatus,
        sentCount: results.sentCount,
        failedCount: results.failedCount,
        failedEmails: results.failedEmails,
        errorLog: results.errors.join('\n'),
        sentAt: new Date(),
      },
    });

    // Log activities
    for (const email of results.successEmails) {
      await this.prisma.newsletterActivity.create({
        data: {
          email,
          action: 'campaign_sent',
          details: `Campaign: ${dto.subject}`,
        },
      });
    }

    this.logger.log(
      `Campaign sent: ${results.sentCount}/${subscribers.length} successful`,
    );

    return {
      success: true,
      campaignId: campaign.id,
      sentCount: results.sentCount,
      failedCount: results.failedCount,
      totalRecipients: subscribers.length,
      status: finalStatus,
      message:
        results.sentCount === subscribers.length
          ? `Newsletter sent successfully to ${results.sentCount} subscribers!`
          : `Sent to ${results.sentCount}/${subscribers.length} subscribers. ${results.failedCount} failed.`,
    };
  }

  /**
   * Get all campaigns (admin only)
   */
  async getAllCampaigns() {
    const campaigns = await this.prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { campaigns };
  }

  /**
   * Get campaign by ID (admin only)
   */
  async getCampaignById(id: string) {
    const campaign = await this.prisma.newsletterCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }
}
