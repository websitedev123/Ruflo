// Builds the system + user prompts for the Claude-powered engine, and
// normalizes/validates the request payload shared by both engines.

export const STAGES = [
  'Just matched',
  'Early talking',
  'Dating',
  'In a relationship',
  'Long distance',
  'Reconnecting / rekindling',
  'Making up after a fight',
];

export const GOALS = [
  'Open a conversation',
  'Reply to their last message',
  'Keep the banter going',
  'Revive a dead/dry chat',
  'Make them laugh',
  'Ask them out',
  'Be flirty',
  'Give a genuine compliment',
  'Apologize / smooth things over',
  'Check in / be thoughtful',
];

export const TONES = [
  'Witty',
  'Playful',
  'Sarcastic',
  'Flirty',
  'Wholesome',
  'Nerdy',
  'Confident',
  'Teasing',
  'Smooth',
  'Deadpan',
];

const SPICE_LABELS = {
  1: 'very tame and friendly',
  2: 'lightly playful',
  3: 'clearly flirty but tasteful',
  4: 'bold and spicy',
  5: 'very forward (still respectful, never explicit)',
};

// Clamp and sanitize whatever the client sent into a predictable shape.
export function normalizeInput(body = {}) {
  const str = (v, max = 4000) =>
    typeof v === 'string' ? v.slice(0, max).trim() : '';
  const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 10) : []);

  let count = Number.parseInt(body.count, 10);
  if (!Number.isFinite(count)) count = 3;
  count = Math.min(Math.max(count, 1), 5);

  let spice = Number.parseInt(body.spice, 10);
  if (!Number.isFinite(spice)) spice = 3;
  spice = Math.min(Math.max(spice, 1), 5);

  return {
    youAbout: str(body.youAbout, 600),
    themAbout: str(body.themAbout, 600),
    stage: str(body.stage, 60),
    goal: str(body.goal, 120),
    tones: arr(body.tones),
    spice,
    voiceSample: str(body.voiceSample, 2000),
    conversation: str(body.conversation, 6000),
    count,
  };
}

export function spiceLabel(spice) {
  return SPICE_LABELS[spice] || SPICE_LABELS[3];
}

export function buildSystemPrompt() {
  return [
    'You are "RizWit", a sharp, funny texting wingmate.',
    'You help the USER draft text messages to a specific person they are romantically interested in.',
    '',
    'Hard rules:',
    '- Write in the USER\'S OWN VOICE. If a voice sample is provided, mirror its vocabulary, rhythm, punctuation, emoji habits and slang. Do not sound like a greeting card or a chatbot.',
    '- You are a drafting aid, not a deception tool. Never impersonate the user to a third party, never fabricate facts about the user\'s life, and never coach manipulation, pressure, control tactics, surveillance, or ignoring a clear "no". Keep everything consent-forward and respectful.',
    '- Texts must read like real phone messages: short, natural, send-ready. Usually one to three sentences. No quotation marks around the message, no email structure, no hashtags unless the voice sample uses them.',
    '- Use the conversation context so replies actually respond to what the other person last said. Be specific, not generic.',
    '- Humor over cheesiness. Clever, warm, a little bold. Avoid pickup-artist clichés and negging.',
    '',
    'Return ONLY a JSON object, no prose, no markdown fences, in exactly this shape:',
    '{ "suggestions": [ { "text": "the message to send", "angle": "2-4 word label e.g. Playful / Sincere / Bold", "why": "one short sentence on why it works" } ] }',
  ].join('\n');
}

export function buildUserPrompt(input) {
  const lines = [];
  lines.push(`Relationship stage: ${input.stage || 'unspecified'}`);
  lines.push(`What I want this message to do: ${input.goal || 'send a good message'}`);
  lines.push(
    `Tone to aim for: ${input.tones.length ? input.tones.join(', ') : 'witty and natural'}`
  );
  lines.push(`Flirtiness level: ${input.spice}/5 — ${spiceLabel(input.spice)}`);
  if (input.youAbout) lines.push(`\nAbout me: ${input.youAbout}`);
  if (input.themAbout) lines.push(`About them: ${input.themAbout}`);
  if (input.voiceSample) {
    lines.push(
      `\nHere are examples of how I normally text (match this voice closely):\n"""\n${input.voiceSample}\n"""`
    );
  }
  if (input.conversation) {
    lines.push(
      `\nOur conversation so far (most recent at the bottom):\n"""\n${input.conversation}\n"""`
    );
  } else {
    lines.push('\n(No prior conversation provided — this may be an opener.)');
  }
  lines.push(
    `\nGive me ${input.count} distinct options, each taking a different angle. Return the JSON object only.`
  );
  return lines.join('\n');
}
