import { env } from '../config/env';

interface EmailResponse {
  success: boolean;
  code?: string;
  error?: string;
}

export async function sendVerificationCode(email: string): Promise<EmailResponse> {
  try {
    // In production, this would call your email service API
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Simulate API call to email service
    const response = await fetch(`${env.apiUrl}/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send verification code');
    }

    // For development, log the code
    console.log(`Verification code for ${email}: ${code}`);
    
    return {
      success: true,
      code,
    };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return {
      success: false,
      error: 'Failed to send verification code',
    };
  }
}