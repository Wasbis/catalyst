import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = { OR: [{ userId: user.id }, { userId: null }] };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
