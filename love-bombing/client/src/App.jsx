import React, { useEffect, useState } from 'react';
import { getConfig, generate } from './api.js';
import Composer from './components/Composer.jsx';
import SuggestionCard from './components/SuggestionCard.jsx';

const EMPTY_FORM = {
  goal: '',
  stage: '',
  spice: 3,
  tones: [],
  conversation: '',
  voiceSample: '',
  themAbout: '',
  youAbout: '',
  count: 3,
};

export default function App() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setError('Could not reach the server. Is it running?'));
  }, []);

  const onGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await generate(form);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>
          Love <span className="heart">Bombing</span>
        </h1>
        <p className="tag">
          Your witty wingmate. Say the right thing — in your own voice, with the context that matters.
        </p>
        {config ? (
          <span className={`engine-badge ${config.engine}`}>
            {config.engine === 'claude'
              ? `⚡ Smart engine live (${config.model})`
              : '🧪 Demo mode — add an API key for fully personalized lines'}
          </span>
        ) : null}
      </header>

      {error ? <div className="banner error">{error}</div> : null}

      {config ? (
        <Composer
          config={config}
          form={form}
          setForm={setForm}
          onGenerate={onGenerate}
          loading={loading}
        />
      ) : (
        <div className="banner">Loading…</div>
      )}

      {result ? (
        <section className="results">
          {result.note ? <div className="banner note">{result.note}</div> : null}
          <div className="results-grid">
            {result.suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} />
            ))}
          </div>
          <button className="regenerate" onClick={onGenerate} disabled={loading}>
            🔁 Give me different ones
          </button>
        </section>
      ) : null}

      <footer className="foot">
        <p>
          Love Bombing is a drafting aid — it helps you sound like your best self, not someone
          else. Be genuine, be kind, and respect a no. 💛
        </p>
      </footer>
    </div>
  );
}
