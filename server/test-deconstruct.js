const fetch = require('node-fetch');

const payload = {
  prompt: 'Extract the keys from this JSON.',
  jsonInput: '{"foo": "bar", "baz": 123}',
  apiKey: process.env.GEMINI_API_KEY || '' // Add your key if needed
};

fetch('http://localhost:3001/deconstruct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    console.log('Response:', data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
