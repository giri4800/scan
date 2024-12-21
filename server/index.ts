import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

if (!process.env.VITE_ANTHROPIC_API_KEY) {
  console.error('Missing Anthropic API key');
  process.exit(1);
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
});

const prisma = new PrismaClient();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Add development mode middleware
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Middleware
app.use(express.json({ limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Additional patient data schema
const additionalPatientDataSchema = z.object({
  lesionLocation: z.enum(['Tongue', 'Buccal Mucosa', 'Floor of Mouth', 'Hard Palate', 'Soft Palate', 'Gingiva', 'Lip']).optional(),
  lesionDuration: z.string().optional(),
  lesionGrowthRate: z.enum(['Slow', 'Moderate', 'Rapid']).optional(),
  previousOralConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  alcoholConsumption: z.enum(['None', 'Occasional', 'Moderate', 'Heavy']).optional(),
  occupation: z.string().optional(),
  dietaryHabits: z.array(z.string()).optional(),
  oralHygiene: z.enum(['Poor', 'Fair', 'Good', 'Excellent']).optional(),
  recentDentalWork: z.boolean().optional(),
  lastDentalVisit: z.string().optional(),
});

// Updated histopathological schema
const histopathologicalSchema = z.object({
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
  additionalData: additionalPatientDataSchema.optional(),
});

app.post('/api/analyze', authenticateToken, async (req: any, res) => {
  try {
    const { imageBase64, histopathologicalData } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Prepare detailed patient history for the prompt
    let patientHistory = '';
    if (histopathologicalData) {
      const { additionalData, ...basicData } = histopathologicalData;
      
      patientHistory = `
Patient Information:
Primary Risk Factors:
- Age: ${basicData.age}
- Tobacco Use: ${basicData.tobacco}
- Smoking History: ${basicData.smoking}
- Pan Masala/Areca Nut Use: ${basicData.panMasala}
- Duration of Symptoms: ${basicData.symptomDuration}

Clinical Symptoms:
${basicData.painLevel ? `- Pain Level: ${basicData.painLevel}` : ''}
${basicData.difficultySwallowing ? `- Difficulty Swallowing: ${basicData.difficultySwallowing}` : ''}
${basicData.weightLoss ? `- Unexplained Weight Loss: ${basicData.weightLoss}` : ''}
${basicData.persistentSoreThroat ? `- Persistent Sore Throat: ${basicData.persistentSoreThroat}` : ''}
${basicData.voiceChanges ? `- Voice Changes: ${basicData.voiceChanges}` : ''}
${basicData.lumpsInNeck ? `- Lumps in Neck: ${basicData.lumpsInNeck}` : ''}

Medical History:
${basicData.familyHistory ? `- Family History of Oral Cancer: ${basicData.familyHistory}` : ''}
${basicData.immuneCompromised ? `- Compromised Immune System: ${basicData.immuneCompromised}` : ''}
${basicData.frequentMouthSores ? `- Frequent Mouth Sores: ${basicData.frequentMouthSores}` : ''}
${basicData.poorDentalHygiene ? `- Poor Dental Hygiene: ${basicData.poorDentalHygiene}` : ''}

${additionalData ? `
Additional Information:
${additionalData.lesionLocation ? `- Lesion Location: ${additionalData.lesionLocation}` : ''}
${additionalData.lesionDuration ? `- Lesion Duration: ${additionalData.lesionDuration}` : ''}
${additionalData.lesionGrowthRate ? `- Lesion Growth Rate: ${additionalData.lesionGrowthRate}` : ''}
${additionalData.previousOralConditions?.length ? `- Previous Oral Conditions: ${additionalData.previousOralConditions.join(', ')}` : ''}
${additionalData.medications?.length ? `- Current Medications: ${additionalData.medications.join(', ')}` : ''}
${additionalData.alcoholConsumption ? `- Alcohol Consumption: ${additionalData.alcoholConsumption}` : ''}
${additionalData.occupation ? `- Occupation: ${additionalData.occupation}` : ''}
${additionalData.dietaryHabits?.length ? `- Dietary Habits: ${additionalData.dietaryHabits.join(', ')}` : ''}
${additionalData.oralHygiene ? `- Oral Hygiene: ${additionalData.oralHygiene}` : ''}
${additionalData.recentDentalWork !== undefined ? `- Recent Dental Work: ${additionalData.recentDentalWork ? 'Yes' : 'No'}` : ''}
${additionalData.lastDentalVisit ? `- Last Dental Visit: ${additionalData.lastDentalVisit}` : ''}
` : ''}`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are an expert oral pathologist with extensive experience in diagnosing oral cancers and precancerous lesions. Analyze this oral cavity image and provide a detailed clinical assessment. Use your expertise to evaluate the visual characteristics and correlate them with the patient's history.

${patientHistory}

Please provide a systematic analysis in the following format:

1. VISUAL EXAMINATION:
   - Describe the lesion's appearance (color, texture, borders)
   - Location and extent
   - Size and shape characteristics
   - Surface characteristics
   - Any visible vascularity or bleeding
   - Surrounding tissue condition

2. CLINICAL CORRELATION:
   - Analyze how patient risk factors align with visual findings
   - Evaluate symptom duration and progression
   - Consider lifestyle factors' impact
   - Assess systemic health influences

3. DIFFERENTIAL DIAGNOSIS:
   - List potential diagnoses in order of likelihood
   - Include specific ICD-10 codes
   - Justify each possibility based on findings

4. RISK STRATIFICATION:
   - Evaluate malignancy risk (Low/Medium/High)
   - Provide confidence level (0-100%)
   - List specific concerning features
   - Identify protective factors

5. RECOMMENDATIONS:
   - Immediate next steps
   - Required investigations
   - Specialist referrals needed
   - Timeline for interventions

6. MANAGEMENT PLAN:
   - Short-term interventions
   - Long-term monitoring
   - Lifestyle modifications
   - Patient education points

7. CULTURAL CONSIDERATIONS:
   - Specific dietary recommendations
   - Cultural practice modifications
   - Family involvement suggestions
   - Community support resources

Format your key findings at the start as:
CONFIDENCE_LEVEL: (Specify 0-100%)
RISK_LEVEL: (LOW/MEDIUM/HIGH)
ANALYSIS: (Detailed analysis following the above structure)

Be direct and specific in your assessment. If you see concerning features, state them clearly. If you're uncertain about aspects, explain why. Focus on actionable insights and clear next steps.`,
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          }
        ]
      }],
      temperature: 0.5,
    });

    const analysis = message.content[0].text;

    // Extract confidence and risk levels
    const confidenceMatch = analysis.match(/CONFIDENCE_LEVEL:\s*(\d+)%/i);
    const riskMatch = analysis.match(/RISK_LEVEL:\s*(LOW|MEDIUM|HIGH)/i);
    const analysisMatch = analysis.match(/ANALYSIS:\s*([\s\S]*)/i);

    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
    const risk = riskMatch ? riskMatch[1].toUpperCase() : 'UNKNOWN';
    const detailedAnalysis = analysisMatch ? analysisMatch[1].trim() : analysis;

    // Skip database operations for development
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ 
        analysis: detailedAnalysis,
        confidence,
        risk,
        rawAnalysis: analysis
      });
    }

    // Database operations
    const scan = await prisma.scan.create({
      data: {
        userId: req.user?.userId || 'development-user',
        imageUrl: imageBase64,
        diagnosis: detailedAnalysis,
        patientData: {
          confidence,
          risk,
          rawAnalysis: analysis,
          ...histopathologicalData
        },
      },
    });

    res.json({ 
      analysis: detailedAnalysis,
      confidence,
      risk,
      rawAnalysis: analysis,
      scanId: scan.id 
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Error analyzing image', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
