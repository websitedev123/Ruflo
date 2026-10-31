import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { generate, hasApiKey } from './lib/generator.js';
import { normalizeInput, STAGES, GOALS, TONES } from './lib/prompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

// Expose config so the UI knows whether the smart engine is live and which
// stage/goal/tone vocab to render.
app.get('/api/config', (_req, res) => {
  res.json({
    engine: hasApiKey() ? 'claude' : 'demo',
    model: hasApiKey() ? process.env.ANTHROPIC_MODEL || 'claude-opus-5-5' : null,
    stages: STAGES,
    goals: GOALS,
    tones: TONES,
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/generate', async (req, res) => {
  try {
    const input = normalizeInput(req.body);
    if (!input.goal && !input.conversation && !input.themAbout) {
      return res.status(400).json({
        error: 'Give me something to work with — pick a goal, or paste your conversation.',
      });
    }
    const result = await generate(input);
    res.json(result);
  } catch (err) {
    console.error('generate failed:', err);
    res.status(500).json({ error: 'Something went wrong generating suggestions. Try again.' });
  }
});

// Serve the built client (production) if it exists.
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`💘 RizWit server on http://localhost:${PORT}`);
  console.log(`   Engine: ${hasApiKey() ? 'Claude (live)' : 'demo (no ANTHROPIC_API_KEY set)'}`);
});
