"use server";

import { prisma } from "@/lib/prisma";

export async function getAuditLogs({ entityType, userId, dateFrom, dateTo, page = 1, pageSize = 25 } = {}) {
  const where = {};

  if (entityType) where.entityType = entityType;
  if (userId) where.userId = userId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(`${dateTo}T23:59:59.999Z`);
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getAuditLogUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
