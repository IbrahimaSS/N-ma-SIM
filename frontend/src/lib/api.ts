const BACKEND = "http://localhost:3001";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("admin_session");
  if (!s) return null;
  return JSON.parse(s).token ?? null;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
  return data;
}
