const express = require('express');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
// NEW: Import the Google Cloud Vision SDK
const vision = require('@google-cloud/vision');
const path = require('path');

// --- NEW: Initialize Vision AI Client ---
// This automatically finds and uses the 'gcloud-credentials.json' key file
// because we have set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, 'gcloud-credentials.json')
});


const app = express();
const PORT = process.env.PORT || 3001;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Using a permissive CORS policy for diagnostics, as established.
app.use(cors({ origin: '*' }));
app.use(express.json());

// This endpoint is no longer needed as the AI Analyst is handled by the Gemini API endpoint.
// For simplicity, we keep the deconstruct endpoint as is.
app.post('/deconstruct', async (req, res) => {
  const { prompt, jsonInput, apiKey } = req.body;
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) return res.status(400).json({ error: 'Gemini API key missing.' });
  if (!prompt || !jsonInput) return res.status(400).json({ error: 'Prompt and jsonInput required.' });
  try {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const fullPrompt = `${prompt}\n\nINPUT JSON:\n${jsonInput}`;
    const payload = { contents: [{ parts: [{ text: fullPrompt }] }] };
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const response = await fetch(`${endpoint}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errorData.error?.message || 'Gemini API error.' });
    }
    const data = await response.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
    res.json({ result: cleanedText });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gemini API call failed.' });
  }
});


// --- UPGRADED ENDPOINT: /scan-gear ---
// This endpoint now performs real OCR using the Google Cloud Vision SDK.
app.post('/scan-gear', upload.single('gear_screenshot'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  console.log('[Server] Received file for OCR processing.');

  try {
    // 1. Prepare the image content for the Vision API.
    const content = req.file.buffer;

    // 2. Call the Vision API to detect text in the image.
    const [result] = await visionClient.textDetection({ image: { content } });
    const detections = result.textAnnotations;
    
    // The first entry in textAnnotations is the full block of detected text.
    const ocrText = detections.length > 0 ? detections[0].description : '';
    
    console.log('[Server] OCR processing successful.');

    // 3. Return the extracted text.
    res.json({
      message: 'OCR processing complete.',
      ocr_text: ocrText
    });

  } catch (error) {
    console.error('Cloud Vision API Error:', error);
    res.status(500).json({ error: `Failed to process image with Vision API: ${error.message}` });
  }
});


app.get('/', (req, res) => {
  res.send('AIA Engine API Proxy is running.');
});

app.listen(PORT, () => {
  console.log(`AIA Engine API Proxy listening on port ${PORT}`);
});