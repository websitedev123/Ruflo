// Thin fetch wrapper around the server API.

export async function getConfig() {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Could not load config');
  return res.json();
}

export async function generate(payload) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Generation failed');
  return data;
}
