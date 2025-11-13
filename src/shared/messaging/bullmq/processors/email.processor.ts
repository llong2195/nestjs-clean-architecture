import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailJobData } from '../queues/email.queue';

/**
 * Email Queue Processor
 *
 * Handles email sending jobs asynchronously
 */
@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, body } = job.data;

    this.logger.log(`Processing email job ${job.id} to ${to}`);

    try {
      // Mock email sending - in production, integrate with SendGrid/SES/etc
      await this.sendEmail(to, subject, body);

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Mock email sending function
   * Replace with actual email service integration
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.debug(`[MOCK] Email sent to: ${to}`);
    this.logger.debug(`[MOCK] Subject: ${subject}`);
    this.logger.debug(`[MOCK] Body: ${body}`);

    // In production, use a real email service:
    // await this.sendgridService.send({ to, subject, html: body });
  }
}
