import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@dual-dictionary/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: AppConfigService) {
    if (config.mailHost) {
      this.transporter = nodemailer.createTransport({
        host: config.mailHost,
        port: config.mailPort,
        secure: config.mailPort === 465,
        auth: config.mailUser
          ? { user: config.mailUser, pass: config.mailPass }
          : undefined,
      });
    } else {
      this.logger.warn('MAIL_HOST not set — mail sending disabled');
    }
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Skipping email to ${String(options.to)}: no transporter`);
      return;
    }

    await this.transporter.sendMail({
      from: options.from ?? this.config.mailFrom,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    this.logger.log(`Email sent → ${String(options.to)}: ${options.subject}`);
  }
}
