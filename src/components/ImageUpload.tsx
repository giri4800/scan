import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { analyzeImage } from '../services/anthropic';

interface AnalysisResponse {
  confidence: number;
  risk: string;
  analysis: string;
  rawAnalysis: string;
}

interface AdditionalPatientData {
  lesionLocation?: 'Tongue' | 'Buccal Mucosa' | 'Floor of Mouth' | 'Hard Palate' | 'Soft Palate' | 'Gingiva' | 'Lip';
  lesionDuration?: string;
  lesionGrowthRate?: 'Slow' | 'Moderate' | 'Rapid';
  previousOralConditions?: string[];
  medications?: string[];
  alcoholConsumption?: 'None' | 'Occasional' | 'Moderate' | 'Heavy';
  occupation?: string;
  dietaryHabits?: string[];
  oralHygiene?: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  recentDentalWork?: boolean;
  lastDentalVisit?: string;
}

interface PatientData {
  age: string;
  tobacco: 'Yes' | 'No' | 'Former';
  smoking: 'Yes' | 'No' | 'Former';
  panMasala: 'Yes' | 'No' | 'Former';
  symptomDuration: string;
  painLevel?: 'None' | 'Mild' | 'Moderate' | 'Severe';
  difficultySwallowing?: 'Yes' | 'No';
  weightLoss?: 'Yes' | 'No';
  familyHistory?: 'Yes' | 'No' | 'Unknown';
  immuneCompromised?: 'Yes' | 'No' | 'Unknown';
  persistentSoreThroat?: 'Yes' | 'No';
  voiceChanges?: 'Yes' | 'No';
  lumpsInNeck?: 'Yes' | 'No';
  frequentMouthSores?: 'Yes' | 'No';
  poorDentalHygiene?: 'Yes' | 'No';
  additionalData?: AdditionalPatientData;
}

export default function ImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientData>({
    age: '',
    tobacco: 'No',
    smoking: 'No',
    panMasala: 'No',
    symptomDuration: '',
    additionalData: {
      lesionLocation: undefined,
      lesionDuration: '',
      lesionGrowthRate: undefined,
      previousOralConditions: [],
      medications: [],
      alcoholConsumption: undefined,
      occupation: '',
      dietaryHabits: [],
      oralHygiene: undefined,
      recentDentalWork: undefined,
      lastDentalVisit: ''
    }
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
        setPreview(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreview(dataUrl);
        setIsCapturing(false);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCapturing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeCurrentImage = async () => {
    if (!preview) {
      setError('Please select or capture an image first');
      return;
    }

    // Validate required fields
    if (!patientData.age || !patientData.symptomDuration) {
      setError('Please provide all required patient information (Age and Symptom Duration are required)');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const base64Image = preview.split(',')[1];
      const result = await analyzeImage(base64Image, patientData);
      
      if (result) {
        setAnalysis({
          confidence: result.confidence || 0,
          risk: result.risk || 'UNKNOWN',
          analysis: result.analysis || '',
          rawAnalysis: result.rawAnalysis || ''
        });
      } else {
        throw new Error('No analysis result received');
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image. Please try again.');
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderPatientDataForm = () => (
    <div className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold">Patient Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.age}
            onChange={(e) => setPatientData(prev => ({ ...prev, age: e.target.value }))}
          >
            <option value="">Select Age Range</option>
            <option value="18-30">18-30</option>
            <option value="31-45">31-45</option>
            <option value="46-60">46-60</option>
            <option value="61-75">61-75</option>
            <option value="76+">76+</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tobacco Use</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.tobacco}
            onChange={(e) => setPatientData(prev => ({ ...prev, tobacco: e.target.value as 'Yes' | 'No' | 'Former' }))}
          >
            <option value="">Select Tobacco Use</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Former">Former</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Smoking</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.smoking}
            onChange={(e) => setPatientData(prev => ({ ...prev, smoking: e.target.value as 'Yes' | 'No' | 'Former' }))}
          >
            <option value="">Select Smoking</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Former">Former</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Pan Masala Use</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.panMasala}
            onChange={(e) => setPatientData(prev => ({ ...prev, panMasala: e.target.value as 'Yes' | 'No' | 'Former' }))}
          >
            <option value="">Select Pan Masala Use</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Former">Former</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Symptom Duration (months)</label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.symptomDuration}
            onChange={(e) => setPatientData(prev => ({ ...prev, symptomDuration: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Pain Level</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.painLevel || ''}
            onChange={(e) => setPatientData(prev => ({ ...prev, painLevel: e.target.value as 'None' | 'Mild' | 'Moderate' | 'Severe' }))}
          >
            <option value="">Select Pain Level</option>
            <option value="None">None</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Difficulty Swallowing</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.difficultySwallowing || ''}
            onChange={(e) => setPatientData(prev => ({ ...prev, difficultySwallowing: e.target.value as 'Yes' | 'No' }))}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Weight Loss</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.weightLoss || ''}
            onChange={(e) => setPatientData(prev => ({ ...prev, weightLoss: e.target.value as 'Yes' | 'No' }))}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Family History</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.familyHistory || ''}
            onChange={(e) => setPatientData(prev => ({ ...prev, familyHistory: e.target.value as 'Yes' | 'No' | 'Unknown' }))}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Immune Compromised</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.immuneCompromised || ''}
            onChange={(e) => setPatientData(prev => ({ ...prev, immuneCompromised: e.target.value as 'Yes' | 'No' | 'Unknown' }))}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAdditionalPatientDataForm = () => (
    <div className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold">Additional Clinical Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Lesion Location</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.lesionLocation || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                lesionLocation: e.target.value as AdditionalPatientData['lesionLocation']
              }
            }))}
          >
            <option value="">Select Location</option>
            <option value="Tongue">Tongue</option>
            <option value="Buccal Mucosa">Buccal Mucosa</option>
            <option value="Floor of Mouth">Floor of Mouth</option>
            <option value="Hard Palate">Hard Palate</option>
            <option value="Soft Palate">Soft Palate</option>
            <option value="Gingiva">Gingiva</option>
            <option value="Lip">Lip</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lesion Duration (months)</label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.lesionDuration || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                lesionDuration: e.target.value
              }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lesion Growth Rate</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.lesionGrowthRate || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                lesionGrowthRate: e.target.value as AdditionalPatientData['lesionGrowthRate']
              }
            }))}
          >
            <option value="">Select Growth Rate</option>
            <option value="Slow">Slow</option>
            <option value="Moderate">Moderate</option>
            <option value="Rapid">Rapid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Alcohol Consumption</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.alcoholConsumption || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                alcoholConsumption: e.target.value as AdditionalPatientData['alcoholConsumption']
              }
            }))}
          >
            <option value="">Select Consumption Level</option>
            <option value="None">None</option>
            <option value="Occasional">Occasional</option>
            <option value="Moderate">Moderate</option>
            <option value="Heavy">Heavy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Occupation</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.occupation || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                occupation: e.target.value
              }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Oral Hygiene</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.oralHygiene || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                oralHygiene: e.target.value as AdditionalPatientData['oralHygiene']
              }
            }))}
          >
            <option value="">Select Hygiene Level</option>
            <option value="Poor">Poor</option>
            <option value="Fair">Fair</option>
            <option value="Good">Good</option>
            <option value="Excellent">Excellent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Recent Dental Work</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.recentDentalWork === undefined ? '' : patientData.additionalData.recentDentalWork.toString()}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                recentDentalWork: e.target.value === 'true'
              }
            }))}
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Last Dental Visit</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.lastDentalVisit || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                lastDentalVisit: e.target.value
              }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Previous Oral Conditions</label>
          <input
            type="text"
            placeholder="Separate with commas"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.previousOralConditions?.join(', ') || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                previousOralConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Current Medications</label>
          <input
            type="text"
            placeholder="Separate with commas"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.medications?.join(', ') || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                medications: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dietary Habits</label>
          <input
            type="text"
            placeholder="Separate with commas"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={patientData.additionalData?.dietaryHabits?.join(', ') || ''}
            onChange={(e) => setPatientData(prev => ({
              ...prev,
              additionalData: {
                ...prev.additionalData,
                dietaryHabits: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }
            }))}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Oral Cancer Detection System
            </h2>

            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-6">
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform transition-all"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Upload Image</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startCamera}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform transition-all"
                  >
                    <Camera className="h-5 w-5" />
                    <span>Use Camera</span>
                  </motion.button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="space-y-8">
                {renderPatientDataForm()}
                {renderAdditionalPatientDataForm()}
              </div>

              <div className="mt-8">
                {isCapturing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative rounded-2xl overflow-hidden shadow-2xl"
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-2xl"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={captureImage}
                      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg"
                    >
                      Capture
                    </motion.button>
                  </motion.div>
                ) : preview ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full rounded-2xl"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPreview(null)}
                        className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        ×
                      </motion.button>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={analyzeCurrentImage}
                      disabled={isAnalyzing}
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform transition-all"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          <span>Analyze Image</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                ) : null}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
                    >
                      <p className="text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {analysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-8 rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 p-6"
                    >
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-200"
                        >
                          <p className="text-sm font-medium text-blue-800">Confidence Level</p>
                          <div className="mt-2 flex items-baseline">
                            <p className="text-3xl font-bold text-blue-600">{analysis.confidence}%</p>
                            <div className="h-2 w-full bg-blue-200 rounded-full ml-3">
                              <div
                                className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${analysis.confidence}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-200"
                        >
                          <p className="text-sm font-medium text-red-800">Risk Level</p>
                          <p className="text-3xl font-bold text-red-600 mt-2">{analysis.risk}</p>
                        </motion.div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="prose max-w-none"
                      >
                        <h4 className="text-xl font-semibold mb-4 text-gray-800">Detailed Analysis</h4>
                        <div className="bg-white/50 rounded-xl p-6 backdrop-blur-sm">
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{analysis.analysis}</p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
