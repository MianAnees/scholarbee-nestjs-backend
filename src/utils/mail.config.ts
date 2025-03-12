import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
console.log('Resend API Key:', resendApiKey ? 'Available' : 'Not available');

// Initialize Resend with API key
const resend = new Resend(resendApiKey);

export interface EmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        const from = options.from || process.env.DEFAULT_FROM_EMAIL || 'noreply@scholarbee.pk';

        // For development, log the email content
        console.log('Email would be sent with the following details:');
        console.log('From:', from);
        console.log('To:', options.to);
        console.log('Subject:', options.subject);

        // Only attempt to send if API key is available
        if (resendApiKey) {
            await resend.emails.send({
                from,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            console.log(`Email sent to ${options.to}`);
        } else {
            console.log('Skipping email send - no API key available');
        }
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw the error to prevent breaking the flow
    }
}; 