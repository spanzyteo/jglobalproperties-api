import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Res,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import express from 'express';
import { NewsletterService } from './newsletter.service';
import {
  SubscribeNewsletterDto,
  UnsubscribeNewsletterDto,
  SendCampaignDto,
} from './dto/create-newsletter.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /**
   * POST /newsletter/subscribe
   * Public endpoint - anyone can subscribe
   */
  @Post('subscribe')
  async subscribe(
    @Body() dto: SubscribeNewsletterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.newsletterService.subscribe({
      ...dto,
      ipAddress: ip,
      userAgent,
    });
  }

  /**
   * POST /newsletter/unsubscribe
   * Public endpoint - anyone can unsubscribe
   */
  @Post('unsubscribe')
  async unsubscribe(@Body() dto: UnsubscribeNewsletterDto) {
    return this.newsletterService.unsubscribe(dto);
  }

  /**
   * GET /newsletter/subscribers
   * Admin only - get all subscribers
   */
  @Get('subscribers')
  @UseGuards(JwtAuthGuard)
  async getSubscribers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsletterService.getAllSubscribers(
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }

  /**
   * GET /newsletter/statistics
   * Admin only - get subscriber statistics
   */
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async getStatistics() {
    return this.newsletterService.getStatistics();
  }

  /**
   * GET /newsletter/export
   * Admin only - export subscribers to CSV
   */
  @Get('export')
  @UseGuards(JwtAuthGuard)
  async exportSubscribers(@Res() res: express.Response) {
    const csv = await this.newsletterService.exportToCsv();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=newsletter-subscribers-${Date.now()}.csv`,
    );
    res.send(csv);
  }

  /**
   * POST /newsletter/send
   * Admin only - send campaign to all subscribers
   */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendCampaign(
    @Body() dto: SendCampaignDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.newsletterService.sendCampaign(dto, req.user.id);
  }

  /**
   * GET /newsletter/campaigns
   * Admin only - get all campaigns
   */
  @Get('campaigns')
  @UseGuards(JwtAuthGuard)
  async getCampaigns() {
    return this.newsletterService.getAllCampaigns();
  }

  /**
   * GET /newsletter/campaigns/:id
   * Admin only - get campaign by ID
   */
  @Get('campaigns/:id')
  @UseGuards(JwtAuthGuard)
  async getCampaignById(@Param('id') id: string) {
    return this.newsletterService.getCampaignById(id);
  }
}
