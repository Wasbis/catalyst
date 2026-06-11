import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://127.0.0.1:8000";

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const draftId = params.id;

  try {
    const res = await fetch(`${SCRAPER_API_URL}/api/v1/proposals/${draftId}/export`, {
      method: "GET",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Export failed");
      return new Response(errText, { status: res.status });
    }

    // Get original filename or set fallback
    const contentDisposition = res.headers.get("content-disposition") || `attachment; filename="proposal_${draftId}.docx"`;
    const contentType = res.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (err) {
    return new Response(err.message, { status: 502 });
  }
}
