import { z } from 'zod';

export const ENV_CONFIG = {
  development: {
    apiUrl: 'http://localhost:3000',
    anthropicApiKey: 'development-key',
  },
  test: {
    apiUrl: 'http://localhost:3000',
    anthropicApiKey: 'test-key',
  },
  production: {
    apiUrl: '',
    anthropicApiKey: '',
  },
} as const;