"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  VALID_PROJECT_STATUSES,
  VALID_LEAD_STATUSES,
  VALID_CHECKLIST_CATEGORIES,
  VALID_TASK_STATUSES,
} from "@/lib/projectStatus";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, diffFields } from "@/lib/auditLog";

/* ────────────────────────────────────────────────────────────
 * PROJECT
 * ──────────────────────────────────────────────────────────── */

export async function getProjects({
  sourceType,
  status,
  client,
  keyword,
  page = 1,
  pageSize = 20,
} = {}) {
  const where = {};

  if (sourceType) where.sourceType = sourceType;
  if (status) where.status = status;
  if (client) where.client = { contains: client, mode: "insensitive" };
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: "insensitive" } },
      { client: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getProjectById(id) {
  return prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      checklistItems: { orderBy: { createdAt: "asc" } },
      phases: { orderBy: { sequence: "asc" }, include: { checklistItems: true } },
      tasks: { orderBy: { createdAt: "asc" } },
      tenderResults: { select: { id: true, title: true, agency: true } },
      leads: { select: { id: true, name: true } },
    },
  });
}

export async function createProjectFromTender(tenderResultId, formData) {
  try {
    const tender = await prisma.tenderResult.findUnique({ where: { id: Number(tenderResultId) } });
    if (!tender) return { success: false, error: "Tender tidak ditemukan." };

    const name = formData.get("name")?.trim() || tender.title;
    const client = formData.get("client")?.trim() || tender.agency || "—";
    const poSoNumber = formData.get("poSoNumber")?.trim() || null;
    const poSoDate = formData.get("poSoDate");

    const project = await prisma.project.create({
      data: {
        name,
        client,
        sourceType: "tender",
        status: "Approval",
        poSoNumber,
        poSoDate: poSoDate ? new Date(poSoDate) : null,
      },
    });

    await prisma.tenderResult.update({
      where: { id: Number(tenderResultId) },
      data: { convertedToProject: true, projectId: project.id },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "create",
      entityType: "Project",
      entityId: project.id,
      metadata: { name },
    });

    revalidatePath("/tenders");
    revalidatePath(`/tenders/${tenderResultId}`);
    revalidatePath("/projects");

    return { success: true, data: { id: project.id } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProject(id, formData) {
  try {
    const name = formData.get("name")?.trim();
    const client = formData.get("client")?.trim();
    if (!name || !client) return { success: false, error: "Nama dan client wajib diisi." };

    const poSoDate = formData.get("poSoDate");

    await prisma.project.update({
      where: { id: Number(id) },
      data: {
        name,
        client,
        poSoNumber: formData.get("poSoNumber")?.trim() || null,
        poSoDate: poSoDate ? new Date(poSoDate) : null,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProjectStatus(id, status) {
  if (!VALID_PROJECT_STATUSES.includes(status)) {
    return {
      success: false,
      error: `Status tidak valid. Pilih salah satu: ${VALID_PROJECT_STATUSES.join(", ")}`,
    };
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: Number(id) } });
    if (!project) return { success: false, error: "Project tidak ditemukan." };

    await prisma.project.update({ where: { id: Number(id) }, data: { status } });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "status_change",
      entityType: "Project",
      entityId: id,
      changes: { status: { old: project.status, new: status } },
      metadata: { name: project.name },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ────────────────────────────────────────────────────────────
 * CHECKLIST ITEM
 * ──────────────────────────────────────────────────────────── */

export async function createChecklistItem(projectId, formData) {
  try {
    const label = formData.get("label")?.trim();
    const category = formData.get("category");
    if (!label) return { success: false, error: "Label dokumen wajib diisi." };
    if (!VALID_CHECKLIST_CATEGORIES.includes(category)) {
      return { success: false, error: "Kategori tidak valid." };
    }

    const phaseId = formData.get("phaseId");

    const item = await prisma.projectChecklistItem.create({
      data: {
        projectId: Number(projectId),
        phaseId: phaseId ? Number(phaseId) : null,
        category,
        label,
        status: "belum",
      },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "create",
      entityType: "ProjectChecklistItem",
      entityId: item.id,
      metadata: { label, projectId: Number(projectId) },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateChecklistItem(id, { status, fileUrl } = {}) {
  try {
    const before = await prisma.projectChecklistItem.findUnique({ where: { id: Number(id) } });

    const item = await prisma.projectChecklistItem.update({
      where: { id: Number(id) },
      data: {
        ...(status !== undefined && { status }),
        ...(fileUrl !== undefined && { fileUrl: fileUrl || null }),
      },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "update",
      entityType: "ProjectChecklistItem",
      entityId: item.id,
      changes: diffFields(before, item, ["status", "fileUrl"]),
      metadata: { label: item.label, projectId: item.projectId },
    });

    revalidatePath(`/projects/${item.projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteChecklistItem(id) {
  try {
    const item = await prisma.projectChecklistItem.delete({ where: { id: Number(id) } });
    revalidatePath(`/projects/${item.projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ────────────────────────────────────────────────────────────
 * PROJECT PHASE (CTR)
 * ──────────────────────────────────────────────────────────── */

export async function createProjectPhase(projectId, formData) {
  try {
    const label = formData.get("label")?.trim();
    if (!label) return { success: false, error: "Label fase wajib diisi." };

    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const disbursementAmount = formData.get("disbursementAmount");

    const phase = await prisma.projectPhase.create({
      data: {
        projectId: Number(projectId),
        label,
        sequence: Number(formData.get("sequence")) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: formData.get("status") || "planned",
        disbursementAmount: disbursementAmount ? BigInt(Math.round(Number(disbursementAmount))) : null,
        disbursementStatus: formData.get("disbursementStatus")?.trim() || null,
        dataCompleteness: formData.get("dataCompleteness") || "full",
      },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "create",
      entityType: "ProjectPhase",
      entityId: phase.id,
      metadata: { label, projectId: Number(projectId) },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProjectPhase(id, formData) {
  try {
    const phase = await prisma.projectPhase.findUnique({ where: { id: Number(id) } });
    if (!phase) return { success: false, error: "Fase tidak ditemukan." };

    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const disbursementAmount = formData.get("disbursementAmount");

    const updated = await prisma.projectPhase.update({
      where: { id: Number(id) },
      data: {
        label: formData.get("label")?.trim() || phase.label,
        sequence: formData.get("sequence") ? Number(formData.get("sequence")) : phase.sequence,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: formData.get("status") || phase.status,
        disbursementAmount: disbursementAmount ? BigInt(Math.round(Number(disbursementAmount))) : phase.disbursementAmount,
        disbursementStatus: formData.get("disbursementStatus")?.trim() || phase.disbursementStatus,
        dataCompleteness: formData.get("dataCompleteness") || phase.dataCompleteness,
      },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "update",
      entityType: "ProjectPhase",
      entityId: updated.id,
      changes: diffFields(phase, updated, ["label", "status", "dataCompleteness", "disbursementStatus"]),
      metadata: { label: updated.label, projectId: updated.projectId },
    });

    revalidatePath(`/projects/${phase.projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ────────────────────────────────────────────────────────────
 * PROJECT TASK (todo admin internal)
 * ──────────────────────────────────────────────────────────── */

export async function createProjectTask(projectId, formData) {
  try {
    const title = formData.get("title")?.trim();
    if (!title) return { success: false, error: "Judul tugas wajib diisi." };

    const dueDate = formData.get("dueDate");

    await prisma.projectTask.create({
      data: {
        projectId: Number(projectId),
        title,
        assignee: formData.get("assignee")?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "todo",
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProjectTaskStatus(id, status) {
  if (!VALID_TASK_STATUSES.includes(status)) {
    return { success: false, error: `Status tidak valid. Pilih salah satu: ${VALID_TASK_STATUSES.join(", ")}` };
  }

  try {
    const task = await prisma.projectTask.update({ where: { id: Number(id) }, data: { status } });
    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteProjectTask(id) {
  try {
    const task = await prisma.projectTask.delete({ where: { id: Number(id) } });
    revalidatePath(`/projects/${task.projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ────────────────────────────────────────────────────────────
 * PROJECT LEAD (non-tender pipeline)
 * ──────────────────────────────────────────────────────────── */

export async function getProjectLeads({ status, keyword, page = 1, pageSize = 100 } = {}) {
  const where = {};

  if (status) where.status = status;
  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: "insensitive" } },
      { client: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.projectLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.projectLead.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getProjectLeadById(id) {
  return prisma.projectLead.findUnique({ where: { id: Number(id) } });
}

export async function createProjectLead(formData) {
  try {
    const name = formData.get("name")?.trim();
    const client = formData.get("client")?.trim();
    if (!name || !client) return { success: false, error: "Nama dan client wajib diisi." };

    const estimatedValue = formData.get("estimatedValue");

    const lead = await prisma.projectLead.create({
      data: {
        name,
        client,
        status: "lead",
        description: formData.get("description")?.trim() || null,
        estimatedValue: estimatedValue ? BigInt(Math.round(Number(estimatedValue))) : null,
        notes: formData.get("notes")?.trim() || null,
      },
    });

    revalidatePath("/projects/leads");
    return { success: true, data: { id: lead.id } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProjectLead(id, formData) {
  try {
    const name = formData.get("name")?.trim();
    const client = formData.get("client")?.trim();
    if (!name || !client) return { success: false, error: "Nama dan client wajib diisi." };

    const estimatedValue = formData.get("estimatedValue");

    await prisma.projectLead.update({
      where: { id: Number(id) },
      data: {
        name,
        client,
        description: formData.get("description")?.trim() || null,
        estimatedValue: estimatedValue ? BigInt(Math.round(Number(estimatedValue))) : null,
        notes: formData.get("notes")?.trim() || null,
      },
    });

    revalidatePath(`/projects/leads/${id}`);
    revalidatePath("/projects/leads");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProjectLeadStatus(id, status) {
  if (!VALID_LEAD_STATUSES.includes(status)) {
    return {
      success: false,
      error: `Status tidak valid. Pilih salah satu: ${VALID_LEAD_STATUSES.join(", ")}`,
    };
  }

  try {
    const before = await prisma.projectLead.findUnique({ where: { id: Number(id) } });
    if (!before) return { success: false, error: "Lead tidak ditemukan." };

    const lead = await prisma.projectLead.update({ where: { id: Number(id) }, data: { status } });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "status_change",
      entityType: "ProjectLead",
      entityId: lead.id,
      changes: { status: { old: before.status, new: status } },
      metadata: { name: lead.name },
    });

    // Auto-convert ke Project saat lead masuk Quotation (kalau belum pernah dikonversi)
    let projectCreated = false;
    let projectId = lead.projectId;
    if (status === "quotation" && !lead.projectId) {
      const project = await prisma.project.create({
        data: {
          name: lead.name,
          client: lead.client,
          sourceType: "non_tender",
          status: "Approval",
        },
      });
      await prisma.projectLead.update({ where: { id: Number(id) }, data: { projectId: project.id } });
      projectCreated = true;
      projectId = project.id;
      revalidatePath("/projects");
    }

    revalidatePath("/projects/leads");
    revalidatePath(`/projects/leads/${id}`);
    return { success: true, data: { projectCreated, projectId } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createProjectFromLead(leadId, formData) {
  try {
    const lead = await prisma.projectLead.findUnique({ where: { id: Number(leadId) } });
    if (!lead) return { success: false, error: "Lead tidak ditemukan." };
    if (lead.status !== "quotation") {
      return { success: false, error: "Lead harus berstatus Quotation sebelum dikonversi ke Project." };
    }

    const name = formData.get("name")?.trim() || lead.name;
    const client = formData.get("client")?.trim() || lead.client;
    const poSoNumber = formData.get("poSoNumber")?.trim() || null;
    const poSoDate = formData.get("poSoDate");

    const project = await prisma.project.create({
      data: {
        name,
        client,
        sourceType: "non_tender",
        status: "Approval",
        poSoNumber,
        poSoDate: poSoDate ? new Date(poSoDate) : null,
      },
    });

    await prisma.projectLead.update({
      where: { id: Number(leadId) },
      data: { projectId: project.id, status: "converted" },
    });

    const user = await getCurrentUser();
    await logActivity({
      userId: user?.id,
      action: "create",
      entityType: "Project",
      entityId: project.id,
      metadata: { name },
    });

    revalidatePath("/projects/leads");
    revalidatePath(`/projects/leads/${leadId}`);
    revalidatePath("/projects");

    return { success: true, data: { id: project.id } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
