import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://127.0.0.1:8000";

export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const res = await fetch(`${SCRAPER_API_URL}/api/v1/tenders/${id}/extract-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: body?.detail ?? `Extraction error: ${res.status}` }, { status: res.status });
    }

    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
