import React, { useState } from 'react';

export default function SuggestionCard({ suggestion }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(suggestion.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context) — select fallback.
      setCopied(false);
    }
  };

  return (
    <div className="suggestion card">
      <div className="suggestion-head">
        <span className="angle">{suggestion.angle}</span>
        <button className="copy" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p className="message">{suggestion.text}</p>
      {suggestion.why ? <p className="why">💡 {suggestion.why}</p> : null}
    </div>
  );
}
