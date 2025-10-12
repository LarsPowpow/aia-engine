// Express backend for Gemini API proxy
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const fullPrompt = `${prompt}\n\nINPUT JSON:\n${jsonInput}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    res.json({ result: cleanedText });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Gemini API call failed.' });
  }
});

app.get('/', (req, res) => {
  res.send('Gemini API Proxy is running.');
});

app.listen(PORT, () => {
  console.log(`Gemini API Proxy listening on port ${PORT}`);
});
