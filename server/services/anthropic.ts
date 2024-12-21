import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.VITE_ANTHROPIC_API_KEY) {
  throw new Error('Missing Anthropic API key');
}

const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
});

export async function analyzeImage(imageBase64: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze this oral cavity image for signs of cancer. Provide a detailed assessment including confidence level and risk factors.'
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64.split(',')[1] // Remove data URL prefix
            }
          }
        ]
      }]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }
}
