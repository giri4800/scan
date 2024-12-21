import express from 'express';
import { PrismaClient } from '@prisma/client';
import { analyzeImage } from '../services/anthropic';

const router = express.Router();
const prisma = new PrismaClient();

// Get all scans for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const scans = await prisma.scan.findMany({
      where: { userId },
      include: {
        patient: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(scans);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching scans' });
  }
});

// Create new scan
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { imageData, patientId } = req.body;

    // Create initial scan record
    const scan = await prisma.scan.create({
      data: {
        userId,
        patientId,
        imageUrl: imageData,
        status: 'PROCESSING'
      }
    });

    // Start analysis in background
    analyzeImage(imageData).then(async (analysis) => {
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          analysis,
          status: 'COMPLETED'
        }
      });
    }).catch(async (error) => {
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: 'FAILED',
          error: error.message
        }
      });
    });

    res.status(201).json(scan);
  } catch (error) {
    res.status(500).json({ error: 'Error creating scan' });
  }
});

export default router;
