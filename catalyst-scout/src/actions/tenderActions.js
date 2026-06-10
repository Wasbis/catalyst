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

export async function updateTenderStatus(id, status) {
  if (!VALID_TENDER_STATUSES.includes(status)) {
    return {
      success: false,
      error: `Status tidak valid. Pilih salah satu: ${VALID_TENDER_STATUSES.join(", ")}`,
    };
  }

  try {
    const result = await scraperFetch(`/api/v1/tenders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });

    revalidatePath("/tenders");
    revalidatePath(`/tenders/${id}`);

    return { success: true, data: result.data };
  } catch (err) {
    return { success: false, error: err.message };
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
