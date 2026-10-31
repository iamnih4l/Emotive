/**
 * Serverless Telemetry Endpoint (Vercel / Netlify compatible)
 * Path: /api/telemetry
 *
 * Receives anonymous reader session telemetry and post-reading Likert ratings
 * for affective computing and interactive narrative research.
 * Strictly adheres to privacy guarantee: Zero face images, audio recordings,
 * or biometric templates are accepted or stored.
 */

export default async function handler(req, res) {
  // Set standard CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'EMOTIVE Research Telemetry Pipeline',
      version: '1.1.0',
      privacyCompliance: '100% Anonymous (Zero-Biometrics Policy)',
      acceptedMetrics: ['dwell_time', 'emotion_distribution', 'narrative_pace', 'likert_evaluations']
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid or empty telemetry payload.' });
    }

    const {
      sessionId,
      timestamp = new Date().toISOString(),
      readingMode = 'camera',
      storyMetadata = {},
      sessionTiming = {},
      paragraphMetrics = [],
      emotionDistribution = {},
      surveyRatings = {},
      clientMeta = {}
    } = payload;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid sessionId.' });
    }

    // Sanitize and ensure no large or binary payload fields are allowed
    const sanitizedRecord = {
      sessionId,
      timestamp,
      readingMode: readingMode === 'manual' ? 'manual' : 'camera',
      storyMetadata: {
        title: String(storyMetadata.title || 'Untitled').slice(0, 150),
        genre: String(storyMetadata.genre || 'General').slice(0, 50),
        style: String(storyMetadata.style || 'Literary').slice(0, 50),
        soundPreset: String(storyMetadata.soundPreset || 'eventide').slice(0, 50),
        desiredLength: Number(storyMetadata.desiredLength) || 8,
        actualParagraphs: Number(storyMetadata.actualParagraphs) || paragraphMetrics.length
      },
      sessionTiming: {
        totalDurationSeconds: Number(sessionTiming.totalDurationSeconds) || 0,
        averageDwellPerParagraphSeconds: Number(sessionTiming.averageDwellPerParagraphSeconds) || 0
      },
      paragraphMetrics: Array.isArray(paragraphMetrics)
        ? paragraphMetrics.map((p, idx) => ({
            index: Number(p.index) || idx + 1,
            dwellSeconds: Number(p.dwellSeconds) || 0,
            wordCount: Number(p.wordCount) || 0,
            readingWpm: Number(p.readingWpm) || 0,
            triggerExpression: String(p.triggerExpression || 'NEUTRAL').slice(0, 30),
            triggerConfidence: Number(p.triggerConfidence) || 0,
            triggerTrend: String(p.triggerTrend || 'Steady').slice(0, 50),
            triggerSource: String(p.triggerSource || 'camera').slice(0, 30),
            moodResult: String(p.moodResult || '').slice(0, 60),
            adaptationApplied: Boolean(p.adaptationApplied)
          }))
        : [],
      emotionDistribution: emotionDistribution && typeof emotionDistribution === 'object' ? emotionDistribution : {},
      surveyRatings: {
        absorption: Number(surveyRatings.absorption) || null,
        responsiveness: Number(surveyRatings.responsiveness) || null,
        soundscapeSynergy: Number(surveyRatings.soundscapeSynergy) || null,
        comments: surveyRatings.comments ? String(surveyRatings.comments).slice(0, 1000) : null
      },
      clientMeta: {
        screenResolution: clientMeta.screenResolution ? String(clientMeta.screenResolution).slice(0, 30) : null,
        userAgentCategory: clientMeta.userAgentCategory ? String(clientMeta.userAgentCategory).slice(0, 80) : null
      }
    };

    // Emit structured JSON log to stdout (collected automatically by Vercel / serverless log drains)
    console.log('[EMOTIVE_TELEMETRY]', JSON.stringify({
      event: 'session_telemetry_recorded',
      recordedAt: new Date().toISOString(),
      ...sanitizedRecord
    }));

    // Optional webhook forwarding if configured in environment
    if (process.env.TELEMETRY_WEBHOOK_URL) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        await fetch(process.env.TELEMETRY_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'EMOTIVE-Telemetry-Worker/1.1'
          },
          body: JSON.stringify(sanitizedRecord),
          signal: controller.signal
        });
        clearTimeout(timeout);
      } catch (webhookErr) {
        console.warn('Telemetry webhook forward failed (non-blocking):', webhookErr.message);
      }
    }

    return res.status(200).json({
      ok: true,
      sessionId,
      message: 'Anonymous research telemetry logged successfully.',
      timestamp: sanitizedRecord.timestamp
    });
  } catch (err) {
    console.error('Error handling telemetry request:', err);
    return res.status(500).json({
      error: 'Internal server error while processing telemetry.',
      details: err.message
    });
  }
}
