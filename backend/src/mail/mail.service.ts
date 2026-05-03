import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private config: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: this.config.get<string>('GMAIL_USER'),
                pass: this.config.get<string>('GMAIL_APP_PASSWORD'),
            },
        });
    }

    async sendPasswordReset(toEmail: string, resetToken: string) {
        const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        await this.transporter.sendMail({
            from: `"Wardrobe App" <${this.config.get('GMAIL_USER')}>`,
            to: toEmail,
            subject: 'Şifre Sıfırlama',
            html: `
                <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px; background: #FDFBF7;">
                    <h1 style="font-size: 28px; font-weight: 300; letter-spacing: -0.5px; margin-bottom: 8px;">Şifre Sıfırlama</h1>
                    <p style="color: #888; font-size: 13px; margin-bottom: 32px; font-style: italic;">Şifreni sıfırlamak için aşağıdaki butona tıkla.</p>

                    <a href="${resetLink}" style="
                        display: inline-block;
                        background: #000;
                        color: #fff;
                        text-decoration: none;
                        padding: 14px 32px;
                        border-radius: 100px;
                        font-size: 12px;
                        font-weight: bold;
                        letter-spacing: 0.15em;
                        text-transform: uppercase;
                    ">Şifremi Sıfırla</a>

                    <p style="color: #aaa; font-size: 12px; margin-top: 32px;">
                        Bu link <strong>1 saat</strong> geçerlidir.<br>
                        Eğer bu isteği sen yapmadıysan bu maili yoksay.
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
                    <p style="color: #ccc; font-size: 11px; font-style: italic;">Wardrobe App</p>
                </div>
            `,
        });

        this.logger.log(`Password reset email sent to ${toEmail}`);
    }
}
