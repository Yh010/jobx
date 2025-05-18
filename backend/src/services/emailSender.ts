import nodemailer from 'nodemailer';
import { EmailPrediction } from '../types';

export class EmailSenderService {
    private transporter: nodemailer.Transporter;

    constructor() {
        console.log('Initializing EmailSenderService with Gmail configuration')
        console.log('Email configuration:', {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            user: process.env.EMAIL_USER ? 'Set' : 'Not Set',
            password: process.env.EMAIL_APP_PASSWORD ? 'Set' : 'Not Set'
        })

        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        // Verify SMTP connection configuration
        this.transporter.verify(function (error, success) {
            if (error) {
                console.error('SMTP connection error:', error);
            } else {
                console.log('SMTP server is ready to take our messages');
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
            userName: string;
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Clean the email address to ensure it's just the email
            const cleanToEmail = to.includes('<') && to.includes('>')
                ? to.match(/<(.*?)>/)?.[1].trim() || to
                : to.trim();

            console.log('Preparing to send email:', {
                to: cleanToEmail, // Use the cleaned email for logging and sending
                originalTo: to, // Log original to see what was passed in
                subject,
                context,
                from: process.env.EMAIL_USER
            })

            // Use a more robust replacement method
            let html = template;
            html = html.replace(/{{founderName}}/g, context.founderName);
            html = html.replace(/{{companyName}}/g, context.companyName);
            html = html.replace(/{{role}}/g, context.role || '');
            html = html.replace(/\[Your Name\]/g, context.userName);

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: cleanToEmail, // Use the cleaned email as the recipient
                subject,
                html
            };

            console.log('Sending email with options:', {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                htmlLength: mailOptions.html.length
            })

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', {
                messageId: info.messageId,
                response: info.response,
                to: info.accepted
            })
            return { success: true };
        } catch (error) {
            console.error('Error sending email to', to, ':', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
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
            userName: string;
        }
    ): Promise<{ email: string; success: boolean; error?: string }[]> {
        console.log('Starting bulk email send for:', {
            founderName: context.founderName,
            companyName: context.companyName,
            userName: context.userName,
            predictionCount: predictions.length,
            predictions: predictions.map(p => ({
                email: p.email,
                confidence: p.confidence
            }))
        })

        const results = [];

        for (const prediction of predictions) {
            console.log('Processing prediction:', {
                email: prediction.email,
                confidence: prediction.confidence,
                reasoning: prediction.reasoning
            })

            // Only send to high confidence predictions
            if (prediction.confidence === 'High') {
                // Extract just the email address from the prediction string if it contains angle brackets
                const emailAddress = prediction.email.includes('<') && prediction.email.includes('>')
                    ? prediction.email.match(/<(.*?)>/)?.[1].trim() || prediction.email
                    : prediction.email.trim();

                console.log('Sending email to high confidence prediction:', emailAddress)
                const result = await this.sendEmail(
                    emailAddress,
                    subject,
                    template,
                    context
                );
                results.push({
                    email: prediction.email,
                    ...result
                });
            } else {
                console.log('Skipping low confidence prediction:', prediction.email)
                results.push({
                    email: prediction.email,
                    success: false,
                    error: 'Low confidence prediction'
                });
            }
        }

        console.log('Bulk email send completed. Results:', results)
        return results;
    }
} 