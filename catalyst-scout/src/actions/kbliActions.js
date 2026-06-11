"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getKbliList(search) {
  return prisma.masterKbli.findMany({
    where: {
      isActive: true,
      ...(search
        ? {
            OR: [
              { kbliCode: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { kbliCode: "asc" },
  });
}

export async function createKbli({ kbliCode, description, category }) {
  if (!kbliCode?.trim() || !description?.trim()) {
    return { success: false, error: "Kode KBLI dan deskripsi wajib diisi." };
  }

  try {
    const data = await prisma.masterKbli.create({
      data: { kbliCode: kbliCode.trim(), description: description.trim(), category, isActive: true },
    });

    revalidatePath("/kbli");

    return { success: true, data };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { success: false, error: "Kode KBLI sudah ada." };
    }
    return { success: false, error: err.message };
  }
}

export async function updateKbli(id, { kbliCode, description, category }) {
  try {
    const data = await prisma.masterKbli.update({
      where: { id: Number(id) },
      data: { kbliCode, description, category },
    });

    revalidatePath("/kbli");

    return { success: true, data };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return { success: false, error: "Kode KBLI sudah ada." };
      if (err.code === "P2025") return { success: false, error: `KBLI dengan id=${id} tidak ditemukan.` };
    }
    return { success: false, error: err.message };
  }
}

export async function toggleKbli(id) {
  const kbli = await prisma.masterKbli.findUnique({ where: { id: Number(id) }, select: { isActive: true } });
  if (!kbli) {
    return { success: false, error: `KBLI dengan id=${id} tidak ditemukan.` };
  }

  const data = await prisma.masterKbli.update({
    where: { id: Number(id) },
    data: { isActive: !kbli.isActive },
  });

  revalidatePath("/kbli");

  return { success: true, data };
}

export async function deleteKbli(id) {
  try {
    await prisma.masterKbli.delete({ where: { id: Number(id) } });

    revalidatePath("/kbli");

    return { success: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003") {
        return { success: false, error: "KBLI ini masih dipakai oleh tender, nonaktifkan saja." };
      }
      if (err.code === "P2025") return { success: false, error: `KBLI dengan id=${id} tidak ditemukan.` };
    }
    return { success: false, error: err.message };
  }
}

export async function bulkCreateKbli(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: "Daftar KBLI kosong." };
  }

  const cleanItems = items
    .filter(item => item.kbliCode?.trim() && item.description?.trim())
    .map(item => ({
      kbliCode: item.kbliCode.trim(),
      description: item.description.trim(),
      category: item.category || "NIB IMPORT",
      isActive: true,
    }));

  try {
    const result = await prisma.masterKbli.createMany({
      data: cleanItems,
      skipDuplicates: true,
    });

    revalidatePath("/kbli");

    return { success: true, count: result.count };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

