/**
 * EMOTIVE — Express / Serverless Backend Proxy for Gemini Story Generation
 * Keeps the production GEMINI_API_KEY strictly on the server side.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting state (simple token bucket per IP)
const rateLimits = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReqs = 30;
  const record = rateLimits.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  record.count += 1;
  rateLimits.set(ip, record);
  return record.count <= maxReqs;
}

/**
 * POST /api/generate-paragraph
 * Receives structured story state + aggregated expression signals (never raw frames)
 * Calls the configured Gemini model and returns validated JSON narrative response.
 */
app.post('/api/generate-paragraph', async (req, res) => {
  try {
    const clientIp = req.ip || 'local';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment before generating the next paragraph.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Server GEMINI_API_KEY is not configured in environment variables.'
      });
    }

    const {
      model = process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction,
      promptPayload
    } = req.body;

    if (!promptPayload) {
      return res.status(400).json({ error: 'Missing promptPayload in request body.' });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const geminiBody = {
      systemInstruction: systemInstruction
        ? { parts: [{ text: systemInstruction }] }
        : undefined,
      contents: [
        {
          role: 'user',
          parts: [{ text: typeof promptPayload === 'string' ? promptPayload : JSON.stringify(promptPayload, null, 2) }]
        }
      ],
      generationConfig: {
        temperature: 0.85,
        topP: 0.92,
        responseMimeType: 'application/json'
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Gemini API error (${response.status})`,
        details: errText
      });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(502).json({ error: 'Empty response from Gemini model.' });
    }

    const parsed = JSON.parse(rawText);
    if (!parsed.paragraph || typeof parsed.paragraph !== 'string') {
      return res.status(502).json({ error: 'Invalid response schema from Gemini model.' });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Error generating paragraph:', err);
    return res.status(500).json({
      error: 'Internal server error during story generation.',
      message: err.message
    });
  }
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`EMOTIVE server running on http://localhost:${port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying http://localhost:${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(Number(PORT));

