export interface Company {
    name: string;
    domain?: string;
    founders: Founder[];
}

export interface Founder {
    name: string;
    role?: string;
    emails: EmailPrediction[];
}

export interface EmailPrediction {
    email: string;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string;
}

export interface EmailFinderResponse {
    company: string;
    domain: string;
    founder: string;
    role?: string;
    predictions: EmailPrediction[];
} 