const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://127.0.0.1:8000"; // lokal dev pakai 127.0.0.1, Docker pakai http://scraper-engine:8000

export async function scraperFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${SCRAPER_API_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(body?.detail ?? `Scraper API error: ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return body;
}
