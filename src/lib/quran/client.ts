/**
 * Client HTTP pour Quran.com v4 et QuranCDN.
 * Deux bases : Quran.com pour le texte/traductions, QuranCDN pour l'audio + timings.
 */

const QURAN_API_BASE = process.env.QURAN_API_BASE ?? "https://api.quran.com/api/v4";
const QURANCDN_BASE = "https://api.qurancdn.com/api/qdc";

class QuranApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly url: string
  ) {
    super(`QuranAPI ${status}: ${message} (${url})`);
  }
}

async function fetchWithRetry(url: string, retries = 2): Promise<unknown> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 }, // cache Next.js 1h
      });

      if (!res.ok) {
        throw new QuranApiError(res.status, res.statusText, url);
      }

      return res.json();
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export async function quranGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${QURAN_API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  return fetchWithRetry(url.toString()) as Promise<T>;
}

export async function quranCdnGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${QURANCDN_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  return fetchWithRetry(url.toString()) as Promise<T>;
}
