import { GoogleGenerativeAI } from '@google/generative-ai';
import { Company, EmailFinderResponse, EmailPrediction } from '../types';
import fs from 'fs';
import path from 'path';

export class EmailFinderService {
    private genAI: GoogleGenerativeAI;
    private prompt: string;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
        this.prompt = fs.readFileSync(
            path.join(__dirname, '../../email_finder_prompt.md'),
            'utf-8'
        );
    }

    async findEmails(company: Company): Promise<EmailFinderResponse[]> {
        const responses: EmailFinderResponse[] = [];
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        for (const founder of company.founders) {
            const prompt = `
${this.prompt}

COMPANY: ${company.name}
FOUNDER: ${founder.name}${founder.role ? ` (${founder.role})` : ''}
${company.domain ? `DOMAIN: ${company.domain}` : ''}

Please analyze and provide the most likely email addresses for this founder.
`;

            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                const predictions = this.parseLLMResponse(text);

                responses.push({
                    company: company.name,
                    domain: company.domain || '',
                    founder: founder.name,
                    role: founder.role,
                    predictions,
                });
            } catch (error) {
                console.error(`Error finding emails for ${founder.name} at ${company.name}:`, error);
                throw error;
            }
        }

        return responses;
    }

    private parseLLMResponse(response: string): EmailFinderResponse['predictions'] {
        const predictions: EmailFinderResponse['predictions'] = [];
        const lines = response.split('\n');

        let currentEmail: Partial<EmailPrediction> = {};

        for (const line of lines) {
            if (line.match(/^\d+\.\s+([^@]+@[^@]+\.[^@]+)/)) {
                // New email prediction
                if (currentEmail.email) {
                    predictions.push(currentEmail as EmailPrediction);
                }
                currentEmail = {
                    email: line.match(/^\d+\.\s+([^@]+@[^@]+\.[^@]+)/)![1],
                };
            } else if (line.includes('confidence')) {
                const confidence = line.match(/\((High|Medium|Low)\s+confidence\)/i)?.[1] as 'High' | 'Medium' | 'Low';
                if (confidence) {
                    currentEmail.confidence = confidence;
                }
            } else if (line.includes('Reasoning:')) {
                currentEmail.reasoning = line.split('Reasoning:')[1].trim();
            }
        }

        // Add the last prediction if exists
        if (currentEmail.email) {
            predictions.push(currentEmail as EmailPrediction);
        }

        return predictions;
    }
} 