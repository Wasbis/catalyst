import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTenderById } from "@/actions/tenderActions";
import { toJSONSafe } from "@/lib/serialize";

// Detail tender (TAHAP 3.3 — halaman /tenders/[id], dipakai client-side fetch)
export async function GET(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!Number.isInteger(Number(id))) {
    return NextResponse.json({ error: `id tidak valid: ${id}` }, { status: 400 });
  }

  const tender = await getTenderById(id);
  if (!tender) {
    return NextResponse.json({ error: `Tender dengan id=${id} tidak ditemukan.` }, { status: 404 });
  }

  return NextResponse.json(toJSONSafe(tender));
}
