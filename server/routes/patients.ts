import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all patients for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const patients = await prisma.patient.findMany({
      where: { doctorId: userId },
      include: {
        scans: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Error fetching patients' });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, age, gender, contactNumber, email, smoking, tobacco, panMasala, medicalHistory } = req.body;

    const patient = await prisma.patient.create({
      data: {
        name,
        age: parseInt(age),
        gender,
        contactNumber,
        email,
        smoking: smoking === 'true' || smoking === true,
        tobacco: tobacco === 'true' || tobacco === true,
        panMasala: panMasala === 'true' || panMasala === true,
        medicalHistory,
        doctorId: userId
      }
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Error creating patient' });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { name, age, gender, contactNumber, email, smoking, tobacco, panMasala, medicalHistory } = req.body;

    const patient = await prisma.patient.update({
      where: { 
        id,
        doctorId: userId // Ensure the patient belongs to the user
      },
      data: {
        name,
        age: parseInt(age),
        gender,
        contactNumber,
        email,
        smoking: smoking === 'true' || smoking === true,
        tobacco: tobacco === 'true' || tobacco === true,
        panMasala: panMasala === 'true' || panMasala === true,
        medicalHistory
      }
    });

    res.status(200).json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Error updating patient' });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    await prisma.patient.delete({
      where: { 
        id,
        doctorId: userId // Ensure the patient belongs to the user
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Error deleting patient' });
  }
});

export default router;
