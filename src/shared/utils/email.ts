import nodemailer from "nodemailer";
import { logger } from "./logger";

/**
 * Email service for sending transactional emails using Nodemailer.
 * Configured via SMTP environment variables. Falls back to logging
 * the email content when SMTP is not configured.
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor() {
    this.fromAddress =
      process.env.SMTP_FROM || "noreply@sistema-identidad.local";

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      logger.info(`Email service configured with SMTP host: ${host}`);
    } else {
      logger.warn(
        "SMTP not configured — emails will be logged to console only",
      );
    }
  }

  /**
   * Sends an OTP verification email to the specified address.
   * @param to - The recipient email address.
   * @param otp - The 6-digit OTP code.
   */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const subject = "Your verification code";
    const text = `Your verification code is: ${otp}\n\nThis code expires in 5 minutes. If you didn't request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a1a; margin-bottom: 24px;">Verification Code</h2>
        <p style="color: #4a4a4a; font-size: 16px;">Use the following code to sign in:</p>
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 14px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      });
      logger.info(`OTP email sent to ${to}`);
    } else {
      logger.info(`[DEV] OTP email for ${to}: ${otp} (SMTP not configured)`);
    }
  }
}
