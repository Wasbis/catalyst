import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { scraperFetch } from "@/lib/scraperApi";

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await scraperFetch(`/api/v1/proposals/${id}`);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
  }
}
