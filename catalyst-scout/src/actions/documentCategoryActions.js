"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, diffFields } from "@/lib/auditLog";

export async function getDocumentCategories({ activeOnly = true } = {}) {
  return prisma.documentCategory.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    include: { _count: { select: { documents: true } } },
  });
}

export async function createDocumentCategory(formData) {
  const name = formData.get("name")?.trim();
  const label = formData.get("label")?.trim();
  const group = formData.get("group")?.trim() || null;
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!name || !label) {
    return { success: false, error: "Name dan label wajib diisi." };
  }

  try {
    const category = await prisma.documentCategory.create({
      data: { name, label, group, sortOrder },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "create",
      entityType: "DocumentCategory",
      entityId: category.id,
      metadata: { label },
    });

    revalidatePath("/settings/document-categories");
    return { success: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { success: false, error: "Nama kategori (slug) sudah ada." };
    }
    return { success: false, error: err.message };
  }
}

export async function updateDocumentCategory(id, formData) {
  const name = formData.get("name")?.trim();
  const label = formData.get("label")?.trim();
  const group = formData.get("group")?.trim() || null;
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!name || !label) {
    return { success: false, error: "Name dan label wajib diisi." };
  }

  try {
    const before = await prisma.documentCategory.findUnique({ where: { id: Number(id) } });

    const after = await prisma.documentCategory.update({
      where: { id: Number(id) },
      data: { name, label, group, sortOrder },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "update",
      entityType: "DocumentCategory",
      entityId: after.id,
      changes: diffFields(before, after, ["name", "label", "group", "sortOrder"]),
      metadata: { label: after.label },
    });

    revalidatePath("/settings/document-categories");
    return { success: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { success: false, error: "Nama kategori (slug) sudah ada." };
    }
    return { success: false, error: err.message };
  }
}

// Soft-delete — kategori yang sudah dipakai DocumentRecord tidak boleh hard-delete
export async function deactivateDocumentCategory(id) {
  const category = await prisma.documentCategory.findUnique({ where: { id: Number(id) } });
  if (!category) {
    return { success: false, error: `Kategori dengan id=${id} tidak ditemukan.` };
  }

  await prisma.documentCategory.update({
    where: { id: Number(id) },
    data: { isActive: !category.isActive },
  });

  const user = await getCurrentUser();
  await logActivity({
    userId: user?.id,
    action: "update",
    entityType: "DocumentCategory",
    entityId: category.id,
    changes: { isActive: { old: category.isActive, new: !category.isActive } },
    metadata: { label: category.label },
  });

  revalidatePath("/settings/document-categories");
  return { success: true };
}
