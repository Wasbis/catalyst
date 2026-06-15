import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "hr");

// Upload dokumen pribadi karyawan (Fase 3 — HR Module). Disimpan non-public
// (storage/hr/, bukan public/uploads/) karena KTP/BPJS/Ijazah/KK/NPWP adalah PII.
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File wajib diisi." }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);

  return NextResponse.json({ fileUrl: fileName });
}
