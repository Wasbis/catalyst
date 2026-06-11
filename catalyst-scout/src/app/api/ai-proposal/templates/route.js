import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { scraperFetch } from "@/lib/scraperApi";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://127.0.0.1:8000";

// Fetch templates list
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await scraperFetch("/api/v1/proposals/templates");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}

// Upload new template (multipart/form-data)
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    
    // Forward the file and fields via fetch to Python scraper engine
    const backendFormData = new FormData();
    for (const [key, val] of formData.entries()) {
      backendFormData.append(key, val);
    }

    const res = await fetch(`${SCRAPER_API_URL}/api/v1/proposals/templates`, {
      method: "POST",
      body: backendFormData,
      // Note: do not set Content-Type header manually for FormData, fetch will set it with boundary
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: body?.detail ?? `Error: ${res.status}` }, { status: res.status });
    }

    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
