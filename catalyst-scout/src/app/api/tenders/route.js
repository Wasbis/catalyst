import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTenders } from "@/actions/tenderActions";
import { toJSONSafe } from "@/lib/serialize";

// List tender (TAHAP 3.1 — tabel + filter bar, dipakai client-side fetch/polling)
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const minScore = searchParams.get("minScore");
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");

  const result = await getTenders({
    source: searchParams.get("source") || undefined,
    status: searchParams.get("status") || undefined,
    minScore: minScore != null ? Number(minScore) : undefined,
    keyword: searchParams.get("keyword") || undefined,
    page: page != null ? Number(page) : undefined,
    pageSize: pageSize != null ? Number(pageSize) : undefined,
  });

  return NextResponse.json(toJSONSafe(result));
}
