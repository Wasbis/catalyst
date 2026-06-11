import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { scraperFetch } from "@/lib/scraperApi";

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blockId = params.id;
  const body = await request.json().catch(() => ({}));

  try {
    const data = await scraperFetch(`/api/v1/proposals/blocks/${blockId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
