/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface NewsletterCampaignResult {
  sentCount: number;
  failedCount: number;
  successEmails: string[];
  failedEmails: string[];
  errors: string[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private readonly batchSize = 100; // Resend free tier limit

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  /**
   * Send individual email
   */
  private async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'JGlobal Properties <newsletter@jglobalproperties.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${options.to}:`, error);
        return false;
      }

      this.logger.log(`Email sent to ${options.to}: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send newsletter welcome email
   */
  async sendNewsletterWelcome(email: string, name?: string): Promise<boolean> {
    const displayName = name || 'there';
    const unsubscribeUrl = `${this.configService.get('FRONTEND_URL')}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to JGlobal Properties Newsletter</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            
            <!-- Header -->
            <div style="background-color: #941A1A; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Welcome to JGlobal Properties Newsletter
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; line-height: 28px; color: #333333; margin: 0 0 20px;">
                Hi ${displayName},
              </p>

              <p style="font-size: 16px; line-height: 24px; color: #333333; margin: 0 0 20px;">
                Thank you for subscribing to our newsletter! 🎉
              </p>

              <p style="font-size: 16px; line-height: 24px; color: #333333; margin: 0 0 20px;">
                You'll now receive essential updates for investors and homebuyers, including:
              </p>

              <ul style="font-size: 16px; line-height: 28px; color: #333333; padding-left: 20px; margin: 0 0 30px;">
                <li>Exclusive property opportunities</li>
                <li>Market insights and trends</li>
                <li>Investment tips and strategies</li>
                <li>Special offers and announcements</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                
                  href="${this.configService.get('FRONTEND_URL')}"
                  style="display: inline-block; background-color: #941A1A; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;"
                >
                  Visit Our Website
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                JGlobal Properties - Your Trusted Real Estate Partner
              </p>
              <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">
                S Deasant Valley Lekki Ajah Expressway, Lagos, Nigeria
              </p>
              <p style="margin: 0 0 15px; font-size: 12px; color: #999999;">
                <a href="tel:+2348164322663" style="color: #941A1A; text-decoration: none;">
                  +234 816 432 2663
                </a>
                {' | '}
                <a href="mailto:info@jglobalproperties.com" style="color: #941A1A; text-decoration: none;">
                  info@jglobalproperties.com
                </a>
              </p>
              <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">
                <a href="${unsubscribeUrl}" style="color: #941A1A; text-decoration: none;">
                  Unsubscribe
                </a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} JGlobal Properties. All rights reserved.
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to JGlobal Properties Newsletter! 🏠',
      html,
    });
  }

  /**
   * Send newsletter campaign to multiple subscribers
   */
  async sendNewsletterCampaign(
    subscribers: { email: string; name: string | null }[],
    subject: string,
    content: string,
  ): Promise<NewsletterCampaignResult> {
    const result: NewsletterCampaignResult = {
      sentCount: 0,
      failedCount: 0,
      successEmails: [],
      failedEmails: [],
      errors: [],
    };

    // Send in batches to respect rate limits
    for (let i = 0; i < subscribers.length; i += this.batchSize) {
      const batch = subscribers.slice(i, i + this.batchSize);

      for (const subscriber of batch) {
        const unsubscribeUrl = `${this.configService.get('FRONTEND_URL')}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${subject}</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                
                <!-- Header -->
                <div style="background-color: #941A1A; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                    JGlobal Properties Newsletter
                  </h1>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px; font-size: 16px; line-height: 24px; color: #333333;">
                  ${content}
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                    JGlobal Properties - Your Trusted Real Estate Partner
                  </p>
                  <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">
                    S Deasant Valley Lekki Ajah Expressway, Lagos, Nigeria
                  </p>
                  <p style="margin: 0 0 15px; font-size: 12px; color: #999999;">
                    <a href="tel:+2348164322663" style="color: #941A1A; text-decoration: none;">
                      +234 816 432 2663
                    </a>
                    {' | '}
                    <a href="mailto:info@jglobalproperties.com" style="color: #941A1A; text-decoration: none;">
                      info@jglobalproperties.com
                    </a>
                  </p>
                  <p style="margin: 0 0 10px; font-size: 12px; color: #999999;">
                    <a href="${unsubscribeUrl}" style="color: #941A1A; text-decoration: none;">
                      Unsubscribe
                    </a>
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #999999;">
                    © ${new Date().getFullYear()} JGlobal Properties. All rights reserved.
                  </p>
                </div>

              </div>
            </body>
          </html>
        `;

        try {
          const success = await this.sendEmail({
            to: subscriber.email,
            subject,
            html,
          });

          if (success) {
            result.sentCount++;
            result.successEmails.push(subscriber.email);
          } else {
            result.failedCount++;
            result.failedEmails.push(subscriber.email);
            result.errors.push(`${subscriber.email}: Failed to send`);
          }
        } catch (error) {
          result.failedCount++;
          result.failedEmails.push(subscriber.email);
          result.errors.push(`${subscriber.email}: ${error.message}`);
          this.logger.error(`Failed to send to ${subscriber.email}:`, error);
        }
      }

      // If there are more batches, log progress
      if (i + this.batchSize < subscribers.length) {
        this.logger.log(
          `Batch complete: ${result.sentCount}/${subscribers.length} sent so far`,
        );
      }
    }

    this.logger.log(
      `Campaign complete: ${result.sentCount} sent, ${result.failedCount} failed`,
    );

    return result;
  }
}
