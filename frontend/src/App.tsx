import React, { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import axios from 'axios'

interface EmailPrediction {
  email: string
  confidence: 'High' | 'Medium' | 'Low'
  reasoning: string
}

interface EmailFinderResponse {
  company: string
  domain: string
  founder: string
  role?: string
  predictions: EmailPrediction[]
}

interface EmailSendingResult {
  company: string
  founder: string
  emailResults: Array<{
    email: string
    success: boolean
    error?: string
  }>
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailTemplate, setEmailTemplate] = useState(`Hello {{founderName}},

I am interested in joining {{companyName}} as a software engineer. I noticed you are the {{role}} and would love to discuss potential opportunities.

Best regards,
[Your Name]`)
  const [emailSubject, setEmailSubject] = useState('Interest in {{companyName}}')
  const [emailPredictions, setEmailPredictions] = useState<EmailFinderResponse[] | null>(null)
  const [emailSendingResults, setEmailSendingResults] = useState<EmailSendingResult[] | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [userName, setUserName] = useState('')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const handleFindEmails = async (event: FormEvent) => {
    event.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('http://localhost:3000/api/find-emails', {
        filePath: file.name,
      })

      setEmailPredictions(response.data.emailPredictions)
      setActiveStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmails = async () => {
    if (!emailPredictions) {
      setError('No email predictions available')
      return
    }

    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Starting to send emails for predictions:', emailPredictions)
      
      // Send emails for each founder separately
      const results = await Promise.all(
        emailPredictions.map(async (prediction) => {
          console.log(`Preparing to send email for ${prediction.founder} at ${prediction.company}`)
          
          // Parse the predictions to extract email and confidence
          const parsedPredictions = prediction.predictions.map(p => {
            // Extract email and confidence from the string
            const emailMatch = p.email.match(/\*\*(.*?)\*\*/);
            const confidenceMatch = p.email.match(/\((.*?)\s*confidence\)/i);
            
            const email = emailMatch ? emailMatch[1].trim() : p.email;
            let confidence: 'High' | 'Medium' | 'Low' = 'Low';
            
            if (confidenceMatch) {
              const confidenceText = confidenceMatch[1].toLowerCase();
              if (confidenceText.includes('high')) {
                confidence = 'High';
              } else if (confidenceText.includes('medium')) {
                confidence = 'Medium';
              }
            }
            
            return {
              email,
              confidence,
              reasoning: p.reasoning
            };
          });

          console.log('Parsed predictions:', parsedPredictions);
          console.log('Request payload:', {
            predictions: parsedPredictions,
            template: emailTemplate,
            subject: emailSubject,
            founderName: prediction.founder,
            companyName: prediction.company,
            role: prediction.role,
            userName: userName
          })

          const response = await axios.post('http://localhost:3000/api/send-emails', {
            predictions: parsedPredictions,
            template: emailTemplate,
            subject: emailSubject,
            founderName: prediction.founder,
            companyName: prediction.company,
            role: prediction.role,
            userName: userName
          })
          
          console.log(`Response for ${prediction.founder}:`, response.data)
          return {
            company: prediction.company,
            founder: prediction.founder,
            emailResults: response.data.results
          }
        })
      )

      console.log('All email sending results:', results)
      setEmailSendingResults(results)
      setActiveStep(2)
    } catch (err) {
      console.error('Error sending emails:', err)
      if (axios.isAxiosError(err)) {
        console.error('Axios error details:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message
        })
      }
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const steps = ['Upload & Find Emails', 'Review & Send', 'Results']

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          JobX - Automated Job Application Assistant
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {activeStep === 0 && (
          <Box component="form" onSubmit={handleFindEmails} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Button variant="contained" component="label" sx={{ mb: 2 }}>
              Upload Excel File
              <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
            </Button>
            {file && <Typography variant="body1" sx={{ mb: 2 }}>Selected file: {file.name}</Typography>}
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading || !file}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Find Emails'}
            </Button>
          </Box>
        )}

        {activeStep === 1 && emailPredictions && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Found Emails
            </Typography>
            <List>
              {emailPredictions.map((prediction, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={`${prediction.founder} (${prediction.role || 'No role'}) at ${prediction.company}`}
                      secondary={
                        <Box component="span">
                          {prediction.predictions.map((p, i) => (
                            <Typography key={i} component="span" display="block" variant="body2">
                              {p.email} ({p.confidence} confidence)
                            </Typography>
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            <TextField
              fullWidth
              label="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              sx={{ mb: 2, mt: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={6}
              label="Email Template"
              value={emailTemplate}
              onChange={(e) => setEmailTemplate(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSendEmails}
              disabled={loading || !userName.trim()}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Emails'}
            </Button>
          </Box>
        )}

        {activeStep === 2 && emailSendingResults && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Email Sending Results
            </Typography>
            <List>
              {emailSendingResults.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={`${result.founder} at ${result.company}`}
                      secondary={
                        <Box component="span">
                          {result.emailResults.map((r, i) => (
                            <Typography
                              key={i}
                              component="span"
                              display="block"
                              variant="body2"
                              color={r.success ? 'success.main' : 'error.main'}
                            >
                              {r.email}: {r.success ? 'Sent' : `Failed - ${r.error}`}
                            </Typography>
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

export default App
