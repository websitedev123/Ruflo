# 💘 RizWit

> Your witty texting wingmate. Say the right thing to someone you're into — in
> **your own voice**, with humor, and using the context of your actual
> conversation.

RizWit helps guys and girls communicate with a romantic interest. You
tell it what you're going for (open a chat, reply, revive a dead thread, ask
them out, make up after a fight…), paste the conversation so far, optionally
drop in a few of your own texts so it matches your voice, and it drafts a few
send-ready options — each with a different angle and a note on why it works.

> **The ethos:** RizWit is a *drafting aid* to help you sound like your
> best self. It is deliberately **not** a manipulation tool — it won't coach
> pressure, deception, surveillance, or ignoring a "no". Be genuine and kind.

## Features

- 🎯 **Goal-driven** — opener, reply, banter, revive a dry chat, ask out, apologize, compliment, check-in.
- 🗣️ **Your voice** — paste sample texts and it mirrors your slang, rhythm, and emoji habits.
- 🧵 **Context-aware** — reads your pasted conversation so replies actually respond to their last message.
- 🌶️ **Flirtiness dial** — tame → forward (always tasteful).
- 😂 **Tone chips** — witty, playful, sarcastic, wholesome, nerdy, confident…
- ⚡ **Smart or demo** — runs on Claude when an API key is set; falls back to a built-in offline generator so it always works.

## Tech stack

- **Server:** Node + Express, [`@anthropic-ai/sdk`](https://www.npmjs.com/package/@anthropic-ai/sdk)
- **Client:** React + Vite
- **AI:** Claude (`claude-opus-5-5` by default, configurable)

## Quick start

```bash
cd rizwit

# 1. Install server + client deps
npm run install:all

# 2. (Optional) enable the real Claude engine
cp server/env.sample server/.env
#   then edit server/.env and set ANTHROPIC_API_KEY=sk-ant-...
#   Without a key, the app runs in "demo" mode (offline sample lines).

# 3a. Dev mode (two processes, hot reload):
npm run dev:server      # terminal 1 → http://localhost:4000
npm run dev:client      # terminal 2 → http://localhost:5173  (proxies /api)

# 3b. …or production mode (single server serves the built UI):
npm run build
npm start               # → http://localhost:4000
```

Open the client URL, pick a goal, paste your chat, and hit **Draft my messages**.

## Configuration

Set these in `server/.env` (see `server/env.sample`):

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | _(unset)_ | Enables the Claude engine. Unset → demo mode. |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | Model to use. Try `claude-sonnet-5-5` or `claude-haiku-5-5` for cheaper/faster. |
| `PORT` | `4000` | Server port. |

## API

- `GET /api/config` — engine status + stage/goal/tone vocab.
- `GET /api/health` — `{ ok: true }`.
- `POST /api/generate` — body: `{ goal, stage, spice, tones[], conversation, voiceSample, themAbout, youAbout, count }` → `{ engine, model, suggestions: [{ text, angle, why }] }`.

## Deploy to Railway

RizWit ships with a [`railway.json`](./railway.json) blueprint. One service builds
the client and runs the Express server, which serves both the API and the built UI.

1. Push this repo to GitHub (already done if you're reading this on the remote).
2. In [Railway](https://railway.app): **New Project → Deploy from GitHub repo**, and
   pick this repository.
3. Open the service's **Settings** and set **Root Directory** to `rizwit`
   (the app lives in a subfolder of the repo). Railway then reads `rizwit/railway.json`.
4. _(Optional, for the smart engine)_ In **Variables**, add:
   - `ANTHROPIC_API_KEY` = your key (`sk-ant-...`). Without it, the app still runs in demo mode.
   - `ANTHROPIC_MODEL` = `claude-opus-5-5` (or `claude-sonnet-5-5` / `claude-haiku-5-5` for cheaper/faster).
   - You do **not** need to set `PORT` — Railway injects it and the server reads it automatically.
5. Deploy. Railway runs `npm install --include=dev && npm run build`, then `npm start`,
   and health-checks `/api/health`.
6. Under **Settings → Networking**, click **Generate Domain** to get your public URL.

> Prefer the CLI? `npm i -g @railway/cli`, then from `rizwit/`: `railway login`,
> `railway init`, `railway up`. Set variables with `railway variables --set ANTHROPIC_API_KEY=...`.

## Project layout

```
rizwit/
├── server/            # Express API + AI engine
│   ├── index.js
│   └── lib/
│       ├── prompt.js      # prompt building + input validation
│       ├── generator.js   # engine selector (Claude ↔ demo)
│       └── demo.js        # offline heuristic generator
└── client/            # React + Vite UI
    └── src/
        ├── App.jsx
        └── components/
```
