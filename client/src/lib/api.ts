export async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });

  if (!res.ok) throw new Error(`Erreur API (${res.status})`);
  return res.json();
}