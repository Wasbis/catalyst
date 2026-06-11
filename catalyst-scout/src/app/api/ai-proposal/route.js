import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { scraperFetch } from "@/lib/scraperApi";

// Generate proposal draft (TAHAP 6 — proxy ke POST /api/v1/proposals)
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (!body.tender_result_id) {
    return NextResponse.json({ error: "tender_result_id wajib diisi." }, { status: 400 });
  }

  try {
    const data = await scraperFetch("/api/v1/proposals", {
      method: "POST",
      body: JSON.stringify({
        tender_result_id: body.tender_result_id,
        template_id: body.template_id ?? null,
        company_name: body.company_name,
        use_masking: body.use_masking ?? true,
        sections_to_replace: body.sections_to_replace ?? null,
        user_requirements: body.user_requirements ?? null,
      }),
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
