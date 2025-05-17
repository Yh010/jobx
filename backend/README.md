# JobX Backend

This is the backend service for automating the job application process by finding founder emails using AI.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
GOOGLE_API_KEY=your_api_key_here
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## API Endpoints

### POST /api/find-emails

Finds email addresses for company founders based on an Excel file.

Request body:
```json
{
  "filePath": "path/to/your/excel/file.xlsx"
}
```

The Excel file should have the following columns:
- companyName: Name of the company
- domain: Company's domain (optional)
- founderName: Name of the founder
- founderRole: Role of the founder (optional)

Response:
```json
{
  "results": [
    {
      "company": "Company Name",
      "domain": "company.com",
      "founder": "Founder Name",
      "role": "CEO",
      "predictions": [
        {
          "email": "founder@company.com",
          "confidence": "High",
          "reasoning": "Based on company's email pattern..."
        }
      ]
    }
  ]
}
```

## Development

The project uses:
- Node.js with TypeScript
- Express.js for the API
- Claude AI for email prediction
- XLSX for Excel file processing

## Error Handling

The API will return appropriate error messages with status codes:
- 400: Bad Request (missing required fields)
- 500: Internal Server Error 