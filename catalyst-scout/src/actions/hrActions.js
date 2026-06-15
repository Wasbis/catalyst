"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { HR_DOC_TYPES, HR_DOC_TYPE_LABELS, computeDocStatus } from "@/lib/hrTypes";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, diffFields } from "@/lib/auditLog";

const STORAGE_DIR = path.join(process.cwd(), "storage", "hr");

// Hitung status per docType (incl. "missing" kalau belum ada record) untuk badge kelengkapan.
function buildDocStatusMap(documents) {
  const map = {};
  for (const docType of HR_DOC_TYPES) {
    const doc = documents.find((d) => d.docType === docType);
    map[docType] = doc ? doc.status : "missing";
  }
  return map;
}

export async function getEmployees({ isActive, keyword, page = 1, pageSize = 20 } = {}) {
  const where = {};

  if (isActive !== undefined) where.isActive = isActive;
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: "insensitive" } },
      { position: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: { documents: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  await checkExpiringDocumentsAndNotify();

  return {
    data: data.map((e) => ({ ...e, docStatusMap: buildDocStatusMap(e.documents) })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEmployeeById(id) {
  const employee = await prisma.employee.findUnique({
    where: { id: Number(id) },
    include: { documents: true },
  });
  if (!employee) return null;

  return { ...employee, docStatusMap: buildDocStatusMap(employee.documents) };
}

export async function createEmployee(formData) {
  const name = formData.get("name")?.trim();
  const position = formData.get("position")?.trim() || null;

  if (!name) {
    return { success: false, error: "Nama wajib diisi." };
  }

  try {
    const data = await prisma.employee.create({ data: { name, position } });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "create",
      entityType: "Employee",
      entityId: data.id,
      metadata: { name },
    });

    revalidatePath("/hr");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateEmployee(id, formData) {
  const name = formData.get("name")?.trim();
  const position = formData.get("position")?.trim() || null;

  if (!name) {
    return { success: false, error: "Nama wajib diisi." };
  }

  try {
    const before = await prisma.employee.findUnique({ where: { id: Number(id) } });

    const data = await prisma.employee.update({
      where: { id: Number(id) },
      data: { name, position },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "update",
      entityType: "Employee",
      entityId: data.id,
      changes: diffFields(before, data, ["name", "position"]),
      metadata: { name: data.name },
    });

    revalidatePath("/hr");
    revalidatePath(`/hr/${id}`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function toggleEmployeeActive(id) {
  const employee = await prisma.employee.findUnique({ where: { id: Number(id) } });
  if (!employee) {
    return { success: false, error: `Karyawan dengan id=${id} tidak ditemukan.` };
  }

  await prisma.employee.update({
    where: { id: Number(id) },
    data: { isActive: !employee.isActive },
  });

  const user = await getCurrentUser();
  await logActivity({
    userId: user?.id,
    action: "update",
    entityType: "Employee",
    entityId: employee.id,
    changes: { isActive: { old: employee.isActive, new: !employee.isActive } },
    metadata: { name: employee.name },
  });

  revalidatePath("/hr");
  revalidatePath(`/hr/${id}`);
  return { success: true };
}

// Create atau replace dokumen existing per docType (1 dokumen aktif per docType per employee).
export async function upsertEmployeeDocument(employeeId, docType, formData) {
  if (!HR_DOC_TYPES.includes(docType)) {
    return { success: false, error: `docType "${docType}" tidak valid.` };
  }

  const fileUrl = formData.get("fileUrl")?.trim();
  const expiryDateRaw = formData.get("expiryDate")?.trim();
  const expiryDate = expiryDateRaw ? new Date(expiryDateRaw) : null;

  if (!fileUrl) {
    return { success: false, error: "File wajib diupload." };
  }

  const status = computeDocStatus(expiryDate);

  try {
    const existing = await prisma.employeeDocument.findUnique({
      where: { employeeId_docType: { employeeId: Number(employeeId), docType } },
    });

    const data = await prisma.employeeDocument.upsert({
      where: { employeeId_docType: { employeeId: Number(employeeId), docType } },
      create: { employeeId: Number(employeeId), docType, fileUrl, expiryDate, status },
      update: { fileUrl, expiryDate, status },
    });

    if (existing && existing.fileUrl !== fileUrl) {
      await unlink(path.join(STORAGE_DIR, existing.fileUrl)).catch(() => {});
    }

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: existing ? "update" : "create",
      entityType: "EmployeeDocument",
      entityId: data.id,
      changes: existing ? diffFields(existing, data, ["fileUrl", "expiryDate", "status"]) : null,
      metadata: { docType, employeeId: Number(employeeId) },
    });

    revalidatePath(`/hr/${employeeId}`);
    revalidatePath("/hr");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Lazy-check (Fase 3.0 opsi a) — dipanggil dari getEmployees()/halaman /hr.
// Scan dokumen yang statusnya expiring_soon/expired dan belum ada notif aktif.
export async function checkExpiringDocumentsAndNotify() {
  const docs = await prisma.employeeDocument.findMany({
    where: { status: { in: ["expiring_soon", "expired"] } },
    include: { employee: true },
  });

  for (const doc of docs) {
    const docLabel = HR_DOC_TYPE_LABELS[doc.docType] ?? doc.docType;
    const actionLink = `/hr/${doc.employeeId}`;
    const verb = doc.status === "expired" ? "sudah expired" : "akan segera expired";
    const title = `Dokumen ${docLabel} — ${doc.employee.name} ${verb}`;

    const existing = await prisma.notification.findFirst({
      where: { actionLink, title, isRead: false },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        title,
        message: `${docLabel} milik ${doc.employee.name} ${verb}${doc.expiryDate ? ` (${doc.expiryDate.toISOString().slice(0, 10)})` : ""}.`,
        actionLink,
        userId: null,
      },
    });
  }
}
