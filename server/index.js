const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer'); // <-- Import multer for file uploads

const app = express();
const PORT = process.env.PORT || 3001;

// --- Multer Configuration for in-memory file storage ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Logging middleware for diagnostics
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Use official cors middleware, explicitly allow all origins
app.use(cors({
  origin: /https:\/\/.*\.app\.github\.dev$/,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// POST /deconstruct: (No changes)
app.post('/deconstruct', async (req, res) => {
  const { prompt, jsonInput, apiKey } = req.body;
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(400).json({ error: 'Gemini API key missing.' });
  }
  if (!prompt || !jsonInput) {
    return res.status(400).json({ error: 'Prompt and jsonInput required.' });
  }
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
    let resultText = '';
    if (data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content?.parts;
      if (parts && parts.length > 0 && parts[0].text) {
        resultText = parts[0].text;
      }
    }
    const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
    res.json({ result: cleanedText });
  } catch (error) {
    res.status(500).json({ error: error.message || error.toString() || 'Gemini API call failed.' });
  }
});

// --- NEW ENDPOINT: /scan-gear ---
// This endpoint expects a single file upload with the field name 'gear_screenshot'
app.post('/scan-gear', upload.single('gear_screenshot'), (req, res) => {
  if (!req.file) {
    console.log('[Server] Scan request received without a file.');
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // For this first step, we just confirm receipt of the file.
  console.log('[Server] Received file:', {
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: `${(req.file.size / 1024).toFixed(2)} KB`,
  });

  res.json({
    message: `File '${req.file.originalname}' received successfully.`,
    // In the future, this will contain the OCR results.
    ocr_text: "OCR processing not yet implemented."
  });
});


app.get('/', (req, res) => {
  res.send('Gemini API Proxy is running.');
});

app.listen(PORT, () => {
  console.log(`Gemini REST API Proxy listening on port ${PORT}`);
});