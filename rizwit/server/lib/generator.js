// Engine selector: tries the real Claude engine when an API key is present,
// and falls back to the offline demo engine otherwise (or on any failure).

import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildUserPrompt } from './prompt.js';
import { generateDemo } from './demo.js';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// The SDK may wrap JSON in prose or code fences despite instructions; extract
// the first balanced JSON object defensively.
function parseSuggestions(raw) {
  if (!raw) return null;
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(obj.suggestions)) return null;
    return obj.suggestions
      .filter((s) => s && typeof s.text === 'string' && s.text.trim())
      .map((s) => ({
        text: String(s.text).trim(),
        angle: String(s.angle || 'Option').trim().slice(0, 40),
        why: String(s.why || '').trim().slice(0, 300),
      }));
  } catch {
    return null;
  }
}

async function generateClaude(input) {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2000,
    // Low effort keeps replies snappy and inexpensive for this chat-style task.
    output_config: { effort: 'low' },
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
  });

  const text = (message.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const suggestions = parseSuggestions(text);
  if (!suggestions || !suggestions.length) {
    const err = new Error('Could not parse a valid suggestion set from the model response.');
    err.code = 'PARSE_FAILED';
    throw err;
  }
  return {
    engine: 'claude',
    model: DEFAULT_MODEL,
    note: null,
    suggestions: suggestions.slice(0, input.count),
  };
}

export async function generate(input) {
  if (!hasApiKey()) {
    return generateDemo(input);
  }
  try {
    return await generateClaude(input);
  } catch (err) {
    const result = generateDemo(input);
    result.note = `Claude engine unavailable (${err.status || err.code || 'error'}); showing demo suggestions instead. Check your ANTHROPIC_API_KEY / model.`;
    result.fallback = true;
    return result;
  }
}
