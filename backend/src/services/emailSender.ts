import nodemailer from 'nodemailer';
import { EmailPrediction } from '../types';

export class EmailSenderService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });
    }

    async sendEmail(
        to: string,
        subject: string,
        template: string,
        context: {
            founderName: string;
            companyName: string;
            role?: string;
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Replace placeholders in the template
            const html = template
                .replace('{{founderName}}', context.founderName)
                .replace('{{companyName}}', context.companyName)
                .replace('{{role}}', context.role || '');

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to,
                subject,
                html
            };

            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async sendBulkEmails(
        predictions: EmailPrediction[],
        template: string,
        subject: string,
        context: {
            founderName: string;
            companyName: string;
            role?: string;
        }
    ): Promise<{ email: string; success: boolean; error?: string }[]> {
        const results = [];

        for (const prediction of predictions) {
            // Only send to high confidence predictions
            if (prediction.confidence === 'High') {
                const result = await this.sendEmail(
                    prediction.email,
                    subject,
                    template,
                    context
                );
                results.push({
                    email: prediction.email,
                    ...result
                });
            }
        }

        return results;
    }
} 