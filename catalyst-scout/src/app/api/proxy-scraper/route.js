import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { scraperFetch } from "@/lib/scraperApi";

// Trigger scrape (TAHAP 3.1 — tombol "Trigger Scrape")
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const data = await scraperFetch("/api/v1/scrape", {
      method: "POST",
      body: JSON.stringify({
        source: body.source ?? "all",
        max_pages: body.max_pages ?? 5,
        keyword: body.keyword ?? "",
        save_to_db: body.save_to_db ?? true,
      }),
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}

// Status bar scraper real-time (TAHAP 3.1 — polling)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await scraperFetch("/api/v1/scrape/status");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
