const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://localhost:8000"; // lokal dev pakai localhost, Docker pakai http://scraper-engine:8000

export async function scraperFetch(path, options = {}) {
  const res = await fetch(`${SCRAPER_API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(body?.detail ?? `Scraper API error: ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return body;
}
