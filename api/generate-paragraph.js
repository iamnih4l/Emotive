/**
 * Serverless Function (Vercel / Netlify compatible)
 * Path: /api/generate-paragraph
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not configured on the server.'
    });
  }

  try {
    const {
      model = process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction,
      promptPayload
    } = req.body || {};

    if (!promptPayload) {
      return res.status(400).json({ error: 'Missing promptPayload in request body.' });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
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
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini error: ${response.status}`, details: errText });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Generation failed' });
  }
}
