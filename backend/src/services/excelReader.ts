import * as XLSX from 'xlsx';
import { Company } from '../types';

export class ExcelReaderService {
    async readCompanies(filePath: string): Promise<Company[]> {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            return data.map((row: any) => ({
                name: row.companyName,
                domain: row.domain,
                founders: [
                    {
                        name: row.founderName,
                        role: row.founderRole,
                        emails: [],
                    },
                ],
            }));
        } catch (error) {
            console.error('Error reading Excel file:', error);
            throw error;
        }
    }
} 