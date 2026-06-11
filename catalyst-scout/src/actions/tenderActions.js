"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scraperFetch } from "@/lib/scraperApi";
import { getCurrentUser } from "@/lib/auth";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";

export async function getTenders({
  source,
  status,
  minScore,
  keyword,
  page = 1,
  pageSize = 20,
} = {}) {
  const where = {};

  if (source) where.source = source;
  if (status) where.status = status;
  if (minScore != null) where.matchScore = { gte: minScore };
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { agency: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.tenderResult.findMany({
      where,
      orderBy: { scrapedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tenderResult.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTenderById(id) {
  return prisma.tenderResult.findUnique({ where: { id: Number(id) } });
}

export async function getTenderStats() {
  try {
    const [total, active, highScore, won, submitted, budgets] = await Promise.all([
      prisma.tenderResult.count(),
      prisma.tenderResult.count({ where: { status: { notIn: ["KALAH", "BATAL"] } } }),
      prisma.tenderResult.count({ where: { matchScore: { gte: 70 } } }),
      prisma.tenderResult.count({ where: { status: "MENANG" } }),
      prisma.tenderResult.count({ where: { status: { in: ["DISERAHKAN", "MENANG"] } } }),
      prisma.tenderResult.aggregate({
        _sum: { budgetEstimated: true },
        where: { status: { notIn: ["KALAH", "BATAL"] } },
      }),
    ]);

    const pipeline = Number(budgets._sum.budgetEstimated ?? 0);
    const pipelineStr = pipeline >= 1e9
      ? `Rp ${(pipeline / 1e9).toFixed(1)} M`
      : pipeline >= 1e6
      ? `Rp ${(pipeline / 1e6).toFixed(0)} jt`
      : "—";

    const winRate = submitted > 0 ? `${Math.round((won / submitted) * 100)}%` : "—";

    return {
      totalFound: total,
      totalActive: active,
      highScore,
      pipelineValue: pipelineStr,
      winRate,
    };
  } catch {
    return { totalFound: 0, totalActive: 0, highScore: 0, pipelineValue: "—", winRate: "—" };
  }
}

export async function createManualTender(formData) {
  try {
    const title = formData.get("title")?.trim();
    const agency = formData.get("agency")?.trim();
    if (!title || !agency) return { success: false, error: "Judul dan instansi wajib diisi." };

    const budget = formData.get("budgetEstimated");
    const deadline = formData.get("deadlineDate");

    await prisma.tenderResult.create({
      data: {
        title,
        agency,
        source: formData.get("source") || "manual",
        status: formData.get("status") || "DITEMUKAN",
        description: formData.get("description") || null,
        sourceUrl: formData.get("sourceUrl") || null,
        budgetEstimated: budget ? BigInt(Math.round(Number(budget))) : null,
        deadlineDate: deadline ? new Date(deadline) : null,
        scrapedAt: new Date(),
      },
    });

    revalidatePath("/tenders");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


export async function updateTenderStatus(id, status) {
  if (!VALID_TENDER_STATUSES.includes(status)) {
    return {
      success: false,
      error: `Status tidak valid. Pilih salah satu: ${VALID_TENDER_STATUSES.join(", ")}`,
    };
  }

  try {
    // Try scraper API first (sync ke Python side)
    const result = await scraperFetch(`/api/v1/tenders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });

    revalidatePath("/tenders");
    revalidatePath(`/tenders/${id}`);

    return { success: true, data: result.data };
  } catch {
    // Fallback: update langsung via Prisma (scraper-engine mungkin tidak running)
    try {
      await prisma.tenderResult.update({
        where: { id: Number(id) },
        data: { status, updatedAt: new Date() },
      });

      revalidatePath("/tenders");
      revalidatePath(`/tenders/${id}`);

      return { success: true };
    } catch (prismaErr) {
      return { success: false, error: prismaErr.message };
    }
  }
}

export async function promoteTender(id) {
  return updateTenderStatus(id, "DITINJAU");
}

export async function addTenderNote(id, note) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = note?.trim();
  if (!trimmed) {
    return { success: false, error: "Catatan tidak boleh kosong." };
  }

  const tender = await prisma.tenderResult.findUnique({
    where: { id: Number(id) },
    select: { notes: true },
  });

  if (!tender) {
    return { success: false, error: `Tender dengan id=${id} tidak ditemukan.` };
  }

  const entry = `[${new Date().toLocaleString("id-ID")}] ${user.name}: ${trimmed}`;
  const updatedNotes = tender.notes ? `${entry}\n---\n${tender.notes}` : entry;

  await prisma.tenderResult.update({
    where: { id: Number(id) },
    data: { notes: updatedNotes },
  });

  revalidatePath(`/tenders/${id}`);

  return { success: true, data: { notes: updatedNotes } };
}
