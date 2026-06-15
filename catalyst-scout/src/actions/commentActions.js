"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const EDIT_WINDOW_MS = 5 * 60 * 1000;

function serializeComment(comment) {
  return {
    id: comment.id,
    content: comment.content,
    authorId: comment.authorId,
    authorName: comment.author.name,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt,
    edits: comment.edits.map((edit) => ({
      id: edit.id,
      previousContent: edit.previousContent,
      editedAt: edit.editedAt,
    })),
  };
}

export async function getComments(entityType, entityId) {
  const comments = await prisma.comment.findMany({
    where: { entityType, entityId: String(entityId) },
    include: { author: true, edits: { orderBy: { editedAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return comments.map(serializeComment);
}

export async function createComment(entityType, entityId, content, path) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = content?.trim();
  if (!trimmed) {
    return { success: false, error: "Komentar tidak boleh kosong." };
  }

  const comment = await prisma.comment.create({
    data: {
      entityType,
      entityId: String(entityId),
      content: trimmed,
      authorId: user.id,
    },
    include: { author: true, edits: true },
  });

  if (path) revalidatePath(path);

  return { success: true, data: serializeComment(comment) };
}

export async function editComment(commentId, content, path) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = content?.trim();
  if (!trimmed) {
    return { success: false, error: "Komentar tidak boleh kosong." };
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return { success: false, error: "Komentar tidak ditemukan." };
  }
  if (comment.authorId !== user.id) {
    return { success: false, error: "Hanya penulis yang bisa mengedit komentar ini." };
  }
  if (Date.now() - comment.createdAt.getTime() > EDIT_WINDOW_MS) {
    return { success: false, error: "Waktu edit (5 menit) sudah lewat." };
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    await tx.commentEdit.create({
      data: { commentId: comment.id, previousContent: comment.content, editedAt: now },
    });
    return tx.comment.update({
      where: { id: comment.id },
      data: { content: trimmed, editedAt: now },
      include: { author: true, edits: { orderBy: { editedAt: "asc" } } },
    });
  });

  if (path) revalidatePath(path);

  return { success: true, data: serializeComment(updated) };
}
