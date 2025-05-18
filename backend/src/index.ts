import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EmailFinderService } from './services/emailFinder';
import { ExcelReaderService } from './services/excelReader';
import { EmailSenderService } from './services/emailSender';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const emailFinder = new EmailFinderService();
const excelReader = new ExcelReaderService();
const emailSender = new EmailSenderService();

app.post('/api/find-emails', async (req: Request, res: Response) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        const absolutePath = path.resolve(process.cwd(), '..', filePath);
        const companies = await excelReader.readCompanies(absolutePath);
        const results = [];

        for (const company of companies) {
            const emailResults = await emailFinder.findEmails(company);
            results.push(...emailResults);
        }

        res.json({ results });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/send-emails', async (req: Request, res: Response) => {
    try {
        const {
            predictions,
            template,
            subject,
            founderName,
            companyName,
            role
        } = req.body;

        if (!predictions || !template || !subject || !founderName || !companyName) {
            return res.status(400).json({
                error: 'Missing required fields: predictions, template, subject, founderName, companyName'
            });
        }

        const results = await emailSender.sendBulkEmails(
            predictions,
            template,
            subject,
            { founderName, companyName, role }
        );

        res.json({ results });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 