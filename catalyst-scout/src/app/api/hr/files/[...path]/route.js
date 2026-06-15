import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

const STORAGE_DIR = path.join(process.cwd(), "storage", "hr");

const CONTENT_TYPES = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// Stream dokumen pribadi karyawan (PII) — auth-gated, file disimpan non-public.
export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path: segments } = await params;
  const relativePath = path.join(...segments);
  const filePath = path.join(STORAGE_DIR, relativePath);

  if (!filePath.startsWith(STORAGE_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    await stat(filePath);
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }
}
