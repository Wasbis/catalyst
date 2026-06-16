import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tandai 1 notifikasi sebagai sudah dibaca (klik notif di BellNotification)
export async function PATCH(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: { id, OR: [{ userId: user.id }, { userId: null }] },
  });
  if (!notification) {
    return NextResponse.json({ error: `Notifikasi dengan id=${id} tidak ditemukan.` }, { status: 404 });
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } });

  return NextResponse.json({ success: true });
}
