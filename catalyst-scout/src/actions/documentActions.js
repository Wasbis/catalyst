"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VALID_DOCUMENT_ENTITY_TYPES } from "@/lib/documentTypes";
import { logActivity, diffFields } from "@/lib/auditLog";

// Path entity asal (untuk revalidate + link "lihat di tender/project") — pola
// polymorphic sama AuditLog (Area 5).
const ENTITY_PATH_PREFIX = {
  TenderResult: "/tenders",
  Project: "/projects",
  ProjectPhase: "/projects",
  ProjectChecklistItem: "/projects",
  ProjectLead: "/projects/leads",
};

function revalidateForEntity(entityType, entityId) {
  revalidatePath("/documents");
  const prefix = ENTITY_PATH_PREFIX[entityType];
  if (prefix && entityId) {
    revalidatePath(`${prefix}/${entityId}`);
  }
}

export async function getDocuments({
  categoryId,
  group,
  entityType,
  entityId,
  client,
  keyword,
  isReference,
  page = 1,
  pageSize = 20,
} = {}) {
  const where = {};

  if (categoryId) where.categoryId = Number(categoryId);
  if (group) where.category = { group };
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = Number(entityId);
  if (client) where.client = { contains: client, mode: "insensitive" };
  if (isReference !== undefined) where.isReference = isReference;
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { tags: { contains: keyword, mode: "insensitive" } },
      { client: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.documentRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true, uploadedBy: { select: { id: true, name: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.documentRecord.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getDocumentById(id) {
  return prisma.documentRecord.findUnique({
    where: { id: Number(id) },
    include: { category: true, uploadedBy: { select: { id: true, name: true } } },
  });
}

export async function createDocument(formData) {
  const title = formData.get("title")?.trim();
  const fileUrl = formData.get("fileUrl")?.trim();
  const categoryId = formData.get("categoryId") ? Number(formData.get("categoryId")) : null;
  const entityType = formData.get("entityType")?.trim() || null;
  const entityId = formData.get("entityId") ? Number(formData.get("entityId")) : null;
  const client = formData.get("client")?.trim() || null;
  const tags = formData.get("tags")?.trim() || null;
  const isReference = formData.get("isReference") === "true" || formData.get("isReference") === "on";

  if (!title || !fileUrl) {
    return { success: false, error: "Title dan file wajib diisi." };
  }
  if (entityType && !VALID_DOCUMENT_ENTITY_TYPES.includes(entityType)) {
    return { success: false, error: `entityType "${entityType}" tidak valid.` };
  }

  const user = await getCurrentUser();

  try {
    const data = await prisma.documentRecord.create({
      data: {
        title,
        fileUrl,
        categoryId,
        entityType,
        entityId,
        client,
        tags,
        isReference,
        uploadedById: user?.id ?? null,
      },
    });

    await logActivity({
      userId: user?.id,
      action: "create",
      entityType: "DocumentRecord",
      entityId: data.id,
      metadata: { title },
    });

    revalidateForEntity(entityType, entityId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateDocument(id, formData) {
  const title = formData.get("title")?.trim();
  const categoryId = formData.get("categoryId") ? Number(formData.get("categoryId")) : null;
  const client = formData.get("client")?.trim() || null;
  const tags = formData.get("tags")?.trim() || null;
  const isReference = formData.get("isReference") === "true" || formData.get("isReference") === "on";

  if (!title) {
    return { success: false, error: "Title wajib diisi." };
  }

  try {
    const before = await prisma.documentRecord.findUnique({ where: { id: Number(id) } });

    const data = await prisma.documentRecord.update({
      where: { id: Number(id) },
      data: { title, categoryId, client, tags, isReference },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "update",
      entityType: "DocumentRecord",
      entityId: data.id,
      changes: diffFields(before, data, ["title", "categoryId", "client", "tags", "isReference"]),
      metadata: { title: data.title },
    });

    revalidateForEntity(data.entityType, data.entityId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteDocument(id) {
  const doc = await prisma.documentRecord.findUnique({ where: { id: Number(id) } });
  if (!doc) {
    return { success: false, error: `Dokumen dengan id=${id} tidak ditemukan.` };
  }

  await prisma.documentRecord.delete({ where: { id: Number(id) } });

  if (doc.fileUrl?.startsWith("/uploads/documents/")) {
    const filePath = path.join(process.cwd(), "public", doc.fileUrl);
    await unlink(filePath).catch(() => {});
  }

  const user = await getCurrentUser();
  await logActivity({
    userId: user?.id,
    action: "delete",
    entityType: "DocumentRecord",
    entityId: doc.id,
    metadata: { title: doc.title },
  });

  revalidateForEntity(doc.entityType, doc.entityId);
  return { success: true };
}

// Dipakai DocumentUploadPanel — daftar dokumen milik satu entity (tender/project/dst)
export async function getDocumentsForEntity(entityType, entityId) {
  if (!VALID_DOCUMENT_ENTITY_TYPES.includes(entityType)) return [];

  return prisma.documentRecord.findMany({
    where: { entityType, entityId: Number(entityId) },
    orderBy: { createdAt: "desc" },
    include: { category: true, uploadedBy: { select: { id: true, name: true } } },
  });
}

// Dipakai DocumentReferencePicker — browse dokumen isReference=true dari entity lain
export async function getReferenceDocuments({ categoryId, client, tags, excludeEntityType, excludeEntityId } = {}) {
  const where = { isReference: true };

  if (categoryId) where.categoryId = Number(categoryId);
  if (client) where.client = { contains: client, mode: "insensitive" };
  if (tags) where.tags = { contains: tags, mode: "insensitive" };

  if (excludeEntityType && excludeEntityId) {
    where.NOT = { entityType: excludeEntityType, entityId: Number(excludeEntityId) };
  }

  return prisma.documentRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { category: true },
    take: 100,
  });
}
