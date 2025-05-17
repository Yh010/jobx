# JobX - Automated Job Application Assistant

JobX is a tool that automates the process of finding and contacting company founders for job applications. It uses AI to predict founder email addresses and helps streamline the cold emailing process.

## Features

- Reads company and founder information from Excel files
- Uses Google's Gemini AI to predict founder email addresses
- Provides confidence levels and reasoning for each email prediction
- RESTful API for easy integration

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google API key with access to Gemini AI

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd jobx
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory:
```
PORT=3000
GOOGLE_API_KEY=your_google_api_key_here
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Excel File Format

Create an Excel file (e.g., `companies.xlsx`) in the project root with the following columns:
- `companyName`: Name of the company
- `domain`: Company's domain (optional)
- `founderName`: Name of the founder
- `founderRole`: Role of the founder (optional)

Example:
| companyName | domain | founderName | founderRole |
|------------|---------|-------------|-------------|
| Example Corp | example.com | John Doe | CEO |
| Tech Startup | techstartup.io | Jane Smith | CTO |

## API Usage

### Find Founder Emails

**Endpoint:** `POST /api/find-emails`

**Request Body:**
```json
{
  "filePath": "companies.xlsx"
}
```

**Response:**
```json
{
  "results": [
    {
      "company": "Example Corp",
      "domain": "example.com",
      "founder": "John Doe",
      "role": "CEO",
      "predictions": [
        {
          "email": "john@example.com",
          "confidence": "High",
          "reasoning": "Based on company's email pattern..."
        }
      ]
    }
  ]
}
```

## Testing the API

You can test the API using curl or any API client like Postman:

```bash
curl -X POST http://localhost:3000/api/find-emails \
  -H "Content-Type: application/json" \
  -d '{"filePath": "companies.xlsx"}'
```

## Project Structure

```
jobx/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── emailFinder.ts
│   │   │   └── excelReader.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── email_finder_prompt.md
│   ├── package.json
│   └── tsconfig.json
├── companies.xlsx
└── README.md
```

## Error Handling

The API returns appropriate error messages with status codes:
- 400: Bad Request (missing required fields)
- 500: Internal Server Error

## Contributing

Feel free to submit issues and enhancement requests! 