// Built-in "demo" engine: a heuristic, offline generator used when no
// ANTHROPIC_API_KEY is configured (or when the API call fails). It produces
// plausible, on-tone suggestions from templates so the app is always usable.

import { spiceLabel } from './prompt.js';

// Pull the other person's last message out of a pasted conversation so the
// demo replies can reference it. We look for the last non-empty line, and
// strip a leading "Them:" / "Him:" / "Her:" / name-style label if present.
function lastIncomingMessage(conversation) {
  if (!conversation) return '';
  const lines = conversation
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return '';
  const last = lines[lines.length - 1];
  return last.replace(/^(them|him|her|they|[a-z0-9_ .'-]{1,20})\s*[:>-]\s*/i, '').trim();
}

function pickKeyword(text) {
  if (!text) return '';
  const stop = new Set(
    'the a an and or but to of in on at for with you your i me my we so if is are was it that this just like what how why when do did get got going gonna lol haha yeah ok okay hey hi'.split(
      ' '
    )
  );
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
  return words.sort((a, b) => b.length - a.length)[0] || '';
}

const EMOJI_BY_SPICE = { 1: '', 2: ' :)', 3: ' 😏', 4: ' 😏🔥', 5: ' 😈' };

function dress(text, input) {
  const emoji = EMOJI_BY_SPICE[input.spice] || '';
  // Only add an emoji flourish if the user's voice sample suggests they use them.
  const usesEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|:\)|:D|<3/u.test(input.voiceSample || '');
  return usesEmoji && emoji ? `${text}${emoji}` : text;
}

export function generateDemo(input) {
  const incoming = lastIncomingMessage(input.conversation);
  const kw = pickKeyword(incoming) || pickKeyword(input.themAbout);
  const goal = (input.goal || '').toLowerCase();
  const them = input.themAbout ? input.themAbout.split(/[.,\n]/)[0].trim() : '';

  const opts = [];

  // Angle 1: Playful — hook off their last message / a keyword.
  if (incoming) {
    opts.push({
      angle: 'Playful callback',
      text: kw
        ? `ok but circling back to the "${kw}" thing — i have strong opinions and a dramatic reenactment ready whenever you are`
        : `wait i need the full story on that, you can't just drop it and leave me on read like a cliffhanger`,
      why: 'References their actual last message so it feels like a real reply, not a canned line.',
    });
  } else {
    opts.push({
      angle: 'Playful opener',
      text: them
        ? `so i hear you're into ${kw || them} — bold claim, but i'm prepared to be impressed`
        : `i was going to open with something smooth and then panicked, so: hi. how's your day actually going`,
      why: 'Light, low-pressure opener that invites an easy reply.',
    });
  }

  // Angle 2: Sincere — warmer, goal-aware.
  if (goal.includes('apolog') || goal.includes('make up') || goal.includes('smooth')) {
    opts.push({
      angle: 'Sincere',
      text: `hey — i've been thinking about it and you were right to be annoyed. i'm sorry. can i make it up to you?`,
      why: 'Owns it plainly without over-explaining, which lands better than a paragraph.',
    });
  } else if (goal.includes('ask') && goal.includes('out')) {
    opts.push({
      angle: 'Sincere ask',
      text: `i'd actually love to take you out properly — are you free ${nextDayPhrase()}? i already have a backup plan in case plan A is a disaster`,
      why: 'Clear intent plus a concrete time makes it easy to say yes to.',
    });
  } else {
    opts.push({
      angle: 'Sincere',
      text: incoming
        ? `honestly talking to you is the best part of my day — ${kw ? `even the ${kw} tangents` : 'tangents included'}`
        : `not going to overthink this one: i like talking to you and wanted to say hi`,
      why: 'Warm and direct — a little vulnerability reads as confidence.',
    });
  }

  // Angle 3: Bold — scales with spice.
  opts.push({
    angle: input.spice >= 4 ? 'Bold' : 'Confident',
    text:
      input.spice >= 4
        ? `i'm choosing to believe this chemistry is mutual and acting accordingly — dinner, ${nextDayPhrase()}, me looking suspiciously good`
        : `fair warning: i'm going to keep finding reasons to text you, so you might as well just agree to hang out`,
    why: `Matches your ${input.spice}/5 setting (${spiceLabel(input.spice)}) with playful confidence, not pressure.`,
  });

  // Extra angles if the user asked for more than 3.
  if (input.count > 3) {
    opts.push({
      angle: 'Curious',
      text: kw
        ? `genuinely need to know your origin story with ${kw} — is this a lifelong thing or a recent plot twist`
        : `random but important question: what's something you're weirdly passionate about that never comes up`,
      why: 'Open-ended question that gives them something fun to answer.',
    });
  }
  if (input.count > 4) {
    opts.push({
      angle: 'Low-key',
      text: `no agenda, just thought of you — hope today's being kind to you`,
      why: 'A soft touch that keeps you on their mind without demanding a reply.',
    });
  }

  return {
    engine: 'demo',
    model: null,
    note:
      'Demo mode: offline sample suggestions. Add an ANTHROPIC_API_KEY to generate smarter, fully personalized messages in your own voice.',
    suggestions: opts.slice(0, input.count).map((o) => ({ ...o, text: dress(o.text, input) })),
  };
}

function nextDayPhrase() {
  const days = ['Thursday', 'Friday', 'this weekend', 'Saturday', 'Sunday'];
  return days[new Date().getDay() % days.length];
}
