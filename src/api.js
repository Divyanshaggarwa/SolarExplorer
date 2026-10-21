const BASE = import.meta.env.VITE_API_BASE || '';

export const getPlanets = () => fetch(`${BASE}/api/planets`).then(r => r.json());
export const getPlanet  = (s) => fetch(`${BASE}/api/planets/${s}`).then(r => r.json());
export const simulate = (body) => fetch(`${BASE}/api/simulate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).then(r => r.json());