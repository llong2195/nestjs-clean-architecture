/**
 * Email Job Data Interface
 */
export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  userId?: string;
}

/**
 * Email Queue Name
 */
export const EMAIL_QUEUE = 'email-queue';
