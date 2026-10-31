import React from 'react';

const SPICE_LABELS = ['', 'Tame', 'Playful', 'Flirty', 'Spicy', 'Forward'];

export default function Composer({ config, form, setForm, onGenerate, loading }) {
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const toggleTone = (tone) => {
    const has = form.tones.includes(tone);
    setForm({
      ...form,
      tones: has ? form.tones.filter((t) => t !== tone) : [...form.tones, tone],
    });
  };

  return (
    <section className="composer card">
      <div className="field">
        <label>What do you want this message to do?</label>
        <div className="chips">
          {config.goals.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip ${form.goal === g ? 'active' : ''}`}
              onClick={() => setForm({ ...form, goal: form.goal === g ? '' : g })}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="stage">Where are things at?</label>
          <select id="stage" value={form.stage} onChange={update('stage')}>
            <option value="">— pick a stage —</option>
            {config.stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="spice">
            Flirtiness: <strong>{SPICE_LABELS[form.spice]}</strong>
          </label>
          <input
            id="spice"
            type="range"
            min="1"
            max="5"
            value={form.spice}
            onChange={(e) => setForm({ ...form, spice: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="field">
        <label>Tone (pick any)</label>
        <div className="chips">
          {config.tones.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${form.tones.includes(t) ? 'active' : ''}`}
              onClick={() => toggleTone(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="conversation">
          Paste your conversation so far <span className="muted">(most recent at the bottom)</span>
        </label>
        <textarea
          id="conversation"
          rows={5}
          placeholder={'Them: haha ok that was actually funny\nMe: i have my moments\nThem: prove it'}
          value={form.conversation}
          onChange={update('conversation')}
        />
      </div>

      <details className="more">
        <summary>Fine-tune: your voice & context</summary>
        <div className="field">
          <label htmlFor="voice">
            How you normally text <span className="muted">(so it sounds like you)</span>
          </label>
          <textarea
            id="voice"
            rows={3}
            placeholder="Paste a few of your own texts — slang, emoji habits, punctuation and all."
            value={form.voiceSample}
            onChange={update('voiceSample')}
          />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="them">About them</label>
            <input
              id="them"
              type="text"
              placeholder="e.g. climber, loves bad puns, vet student"
              value={form.themAbout}
              onChange={update('themAbout')}
            />
          </div>
          <div className="field">
            <label htmlFor="you">About you</label>
            <input
              id="you"
              type="text"
              placeholder="e.g. sarcastic, into film photography"
              value={form.youAbout}
              onChange={update('youAbout')}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="count">How many options? {form.count}</label>
          <input
            id="count"
            type="range"
            min="1"
            max="5"
            value={form.count}
            onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
          />
        </div>
      </details>

      <button className="generate" onClick={onGenerate} disabled={loading}>
        {loading ? 'Cooking up lines…' : '💘 Draft my messages'}
      </button>
    </section>
  );
}
