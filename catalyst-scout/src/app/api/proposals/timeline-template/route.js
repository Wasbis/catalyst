import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${SCRAPER_API_URL}/api/v1/proposals/timeline-template`);
    
    if (!res.ok) {
      return new NextResponse(`Error: ${res.statusText}`, { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    headers.set("Content-Disposition", res.headers.get("Content-Disposition") || `attachment; filename="timeline_template.xlsx"`);

    return new NextResponse(arrayBuffer, { headers });
  } catch (err) {
    console.error("Timeline template download error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
