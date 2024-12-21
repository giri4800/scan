import { z } from 'zod';
import { ENV_CONFIG } from './constants';

const envSchema = z.object({
  apiUrl: z.string().url().default('http://localhost:3000'),
  anthropicApiKey: z.string().min(1),
});

type EnvConfig = z.infer<typeof envSchema>;

function loadEnvConfig(): EnvConfig {
  const isDev = import.meta.env.DEV;
  
  const config = {
    apiUrl: import.meta.env.VITE_API_URL,
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || 'default-key-for-development',
  };

  try {
    return envSchema.parse(config);
  } catch (error) {
    if (isDev) {
      console.warn('Using default configuration for development:', error);
      return {
        apiUrl: 'http://localhost:3000',
        anthropicApiKey: 'default-key-for-development',
      };
    }
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => issue.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

export const env = loadEnvConfig();