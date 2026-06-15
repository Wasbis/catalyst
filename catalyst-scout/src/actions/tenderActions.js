"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scraperFetch } from "@/lib/scraperApi";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";
import { toJSONSafe } from "@/lib/serialize";

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

// Versi JSON-safe untuk dipanggil langsung dari client component (mis. TenderDetailDrawer)
export async function getTenderDetailForDrawer(id) {
  const tender = await getTenderById(id);
  return toJSONSafe(tender);
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

  let updateData;
  try {
    // Try scraper API first (sync ke Python side)
    const result = await scraperFetch(`/api/v1/tenders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    updateData = result.data;
  } catch {
    // Fallback: update langsung via Prisma (scraper-engine mungkin tidak running)
    try {
      await prisma.tenderResult.update({
        where: { id: Number(id) },
        data: { status, updatedAt: new Date() },
      });
    } catch (prismaErr) {
      return { success: false, error: prismaErr.message };
    }
  }

  // Auto-convert ke Project saat tender MENANG (kalau belum pernah dikonversi)
  let projectCreated = false;
  let projectId = null;
  if (status === "MENANG") {
    const tender = await prisma.tenderResult.findUnique({ where: { id: Number(id) } });
    if (tender && !tender.convertedToProject) {
      const project = await prisma.project.create({
        data: {
          name: tender.title,
          client: tender.agency || "—",
          sourceType: "tender",
          status: "Approval",
        },
      });
      await prisma.tenderResult.update({
        where: { id: Number(id) },
        data: { convertedToProject: true, projectId: project.id },
      });
      projectCreated = true;
      projectId = project.id;
      revalidatePath("/projects");
    }
  }

  revalidatePath("/tenders");
  revalidatePath(`/tenders/${id}`);

  return { success: true, data: { ...updateData, projectCreated, projectId } };
}

export async function promoteTender(id) {
  return updateTenderStatus(id, "DITINJAU");
}

