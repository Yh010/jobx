import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EmailFinderService } from './services/emailFinder';
import { ExcelReaderService } from './services/excelReader';
import { EmailSenderService } from './services/emailSender';
import { EmailFinderResponse } from './types';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const emailFinder = new EmailFinderService();
const excelReader = new ExcelReaderService();
const emailSender = new EmailSenderService();

// Default email template
const DEFAULT_EMAIL_TEMPLATE = `Hello {{founderName}},

I am interested in joining {{companyName}} as a software engineer. I noticed you are the {{role}} and would love to discuss potential opportunities.

Best regards,
[Your Name]`;

const DEFAULT_EMAIL_SUBJECT = "Interest in {{companyName}}";

interface EmailSendingResult {
    company: string;
    founder: string;
    emailResults: Array<{
        email: string;
        success: boolean;
        error?: string;
    }>;
}

app.post('/api/find-emails', async (req: Request, res: Response) => {
    try {
        const {
            filePath,
            emailTemplate = DEFAULT_EMAIL_TEMPLATE,
            emailSubject = DEFAULT_EMAIL_SUBJECT
        } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        // Resolve the path relative to the project root (one level up from backend)
        const absolutePath = path.resolve(process.cwd(), '..', filePath);
        const companies = await excelReader.readCompanies(absolutePath);
        const emailPredictions: EmailFinderResponse[] = [];
        const emailSendingResults: EmailSendingResult[] = [];

        for (const company of companies) {
            const predictions = await emailFinder.findEmails(company);
            emailPredictions.push(...predictions);

            // Send emails for each founder
            const userNameForSend = 'User'; // Replace with actual user name if available

            for (const prediction of predictions) {
                const sendResults = await emailSender.sendBulkEmails(
                    prediction.predictions,
                    emailTemplate,
                    emailSubject,
                    {
                        founderName: prediction.founder,
                        companyName: prediction.company,
                        role: prediction.role,
                        userName: userNameForSend
                    }
                );
                emailSendingResults.push({
                    company: prediction.company,
                    founder: prediction.founder,
                    emailResults: sendResults
                });
            }
        }

        res.json({
            emailPredictions,
            emailSendingResults
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/send-emails', async (req: Request, res: Response) => {
    try {
        console.log('Received send-emails request:', req.body)

        const {
            predictions,
            template,
            subject,
            founderName,
            companyName,
            role,
            userName
        } = req.body;

        if (!predictions || !template || !subject || !founderName || !companyName || !userName) {
            console.error('Missing required fields:', {
                hasPredictions: !!predictions,
                hasTemplate: !!template,
                hasSubject: !!subject,
                hasFounderName: !!founderName,
                hasCompanyName: !!companyName,
                hasUserName: !!userName
            })
            return res.status(400).json({
                error: 'Missing required fields: predictions, template, subject, founderName, companyName, userName'
            });
        }

        console.log('Processing email send request for:', {
            founderName,
            companyName,
            role,
            userName,
            predictionCount: predictions.length
        })

        const results = await emailSender.sendBulkEmails(
            predictions,
            template,
            subject,
            { founderName, companyName, role, userName }
        );

        console.log('Email sending results:', results)
        res.json({ results });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 