import { prisma } from "@/lib/prisma";

export function diffFields(before, after, fields) {
  const changes = {};
  for (const f of fields) {
    const oldVal = before?.[f] ?? null;
    const newVal = after?.[f] ?? null;
    const oldStr = oldVal instanceof Date || typeof oldVal === "bigint" ? String(oldVal) : oldVal;
    const newStr = newVal instanceof Date || typeof newVal === "bigint" ? String(newVal) : newVal;
    if (oldStr !== newStr) changes[f] = { old: oldStr, new: newStr };
  }
  return Object.keys(changes).length ? changes : null;
}

export async function logActivity({ userId, action, entityType, entityId, changes = null, metadata = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entityType,
        entityId: String(entityId),
        changesJson: changes,
        metadata,
      },
    });
  } catch (err) {
    console.error("logActivity failed:", err);
  }
}
