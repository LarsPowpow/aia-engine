
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

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

// POST /deconstruct: expects { prompt, jsonInput, apiKey? }
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
    // Use Gemini REST API (v1beta/models/gemini-2.0-flash:generateContent)
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const fullPrompt = `${prompt}\n\nINPUT JSON:\n${jsonInput}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: fullPrompt }
          ]
        }
      ]
    };
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
    // Extract text from response
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

app.get('/', (req, res) => {
  res.send('Gemini API Proxy is running.');
});

app.listen(PORT, () => {
  console.log(`Gemini REST API Proxy listening on port ${PORT}`);
});
