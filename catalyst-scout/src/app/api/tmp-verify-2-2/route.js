import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.tenderResult.findMany({ take: 3, orderBy: { scrapedAt: "desc" } });
    return NextResponse.json({ count: data.length, sample: data.map((t) => ({ id: t.id, title: t.title })) });
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
