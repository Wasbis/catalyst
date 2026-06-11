import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    
    // Forward the file/data to Python scraper engine
    const backendFormData = new FormData();
    for (const [key, val] of formData.entries()) {
      backendFormData.append(key, val);
    }

    const res = await fetch(`${SCRAPER_API_URL}/api/v1/kbli/import-preview`, {
      method: "POST",
      body: backendFormData,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: body?.detail ?? `Preview import error: ${res.status}` }, { status: res.status });
    }

    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
