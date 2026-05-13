const API_URL = import.meta.env.VITE_API_URL || "";

export function apiUrl(path: string) {
  return API_URL + path;
}

export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(apiUrl(path), { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null }
}

export async function apiPost<T>(path: string, data: unknown): Promise<T | null> {
  try {
    const res = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null }
}

export async function apiDelete(path: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(path), { method: "DELETE" });
    return res.ok;
  } catch { return false }
}
