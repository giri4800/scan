import { z } from 'zod';
import { env } from '../config/env';

export const histopathologicalSchema = z.object({
  age: z.string(),
  tobacco: z.enum(['Yes', 'No', 'Former']),
  smoking: z.enum(['Yes', 'No', 'Former']),
  panMasala: z.enum(['Yes', 'No', 'Former']),
  symptomDuration: z.string(),
  painLevel: z.enum(['None', 'Mild', 'Moderate', 'Severe']).optional(),
  difficultySwallowing: z.enum(['Yes', 'No']).optional(),
  weightLoss: z.enum(['Yes', 'No']).optional(),
  familyHistory: z.enum(['Yes', 'No', 'Unknown']).optional(),
  immuneCompromised: z.enum(['Yes', 'No', 'Unknown']).optional(),
  persistentSoreThroat: z.enum(['Yes', 'No']).optional(),
  voiceChanges: z.enum(['Yes', 'No']).optional(),
  lumpsInNeck: z.enum(['Yes', 'No']).optional(),
  frequentMouthSores: z.enum(['Yes', 'No']).optional(),
  poorDentalHygiene: z.enum(['Yes', 'No']).optional(),
});

export type HistopathologicalData = z.infer<typeof histopathologicalSchema>;

export interface AnalysisResponse {
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  analysis: string;
  rawAnalysis: string;
  scanId?: string;
}

export async function analyzeImage(
  imageBase64: string,
  histopathologicalData?: HistopathologicalData
): Promise<AnalysisResponse | null> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${env.apiUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        imageBase64,
        histopathologicalData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to analyze image');
    }

    const data = await response.json();
    return {
      confidence: Number(data.confidence) || 0,
      risk: (data.risk || 'UNKNOWN').toUpperCase() as AnalysisResponse['risk'],
      analysis: data.analysis || '',
      rawAnalysis: data.rawAnalysis || '',
      scanId: data.scanId,
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}
