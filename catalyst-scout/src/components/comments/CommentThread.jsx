"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { getComments, createComment, editComment } from "@/actions/commentActions";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDateTime, getInitials } from "@/lib/formatters";
import Button from "@/components/ui/Button";

const EDIT_WINDOW_MS = 5 * 60 * 1000;

const TEXTAREA_CLASSES =
  "block w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-foreground placeholder:text-foreground-subtle transition-colors duration-150 hover:border-foreground-subtle focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_3px_var(--accent-active)]";

export default function CommentThread({ entityType, entityId, currentUserId, revalidatePathTarget }) {
  const { addToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getComments(entityType, String(entityId)).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [entityType, entityId]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setPending(true);
    try {
      const res = await createComment(entityType, String(entityId), draft.trim(), revalidatePathTarget);
      if (res.success) {
        setComments((prev) => [res.data, ...prev]);
        setDraft("");
      } else {
        addToast(res.error ?? "Gagal menyimpan komentar", "error");
      }
    } catch (err) {
      addToast(err.message ?? "Gagal menyimpan komentar", "error");
    } finally {
      setPending(false);
    }
  }

  function handleUpdated(updated) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <div className="mb-4 flex max-h-85 flex-col gap-3.5 overflow-y-auto">
      {!loading && comments.length === 0 && (
        <p className="text-[13px] text-foreground-subtle">Belum ada komentar.</p>
      )}
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          revalidatePathTarget={revalidatePathTarget}
          onUpdated={handleUpdated}
        />
      ))}
      <div className={`flex flex-col gap-2 ${comments.length ? "mt-1" : ""}`}>
        <textarea
          rows={2}
          value={draft}
          placeholder="Tulis komentar…"
          onChange={(e) => setDraft(e.target.value)}
          className={TEXTAREA_CLASSES}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd} disabled={!draft.trim() || pending}>
            <Plus className="h-3.25 w-3.25" strokeWidth={2.5} />
            {pending ? "Menyimpan…" : "Tambah"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, currentUserId, revalidatePathTarget, onUpdated }) {
  const { addToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [pending, setPending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [withinEditWindow, setWithinEditWindow] = useState(true);

  useEffect(() => {
    const remaining = EDIT_WINDOW_MS - (Date.now() - new Date(comment.createdAt).getTime());
    const timer = setTimeout(() => setWithinEditWindow(false), Math.max(remaining, 0));
    return () => clearTimeout(timer);
  }, [comment.createdAt]);

  const isAuthor = currentUserId && comment.authorId === currentUserId;
  const canEdit = isAuthor && withinEditWindow;

  async function handleSave() {
    if (!editDraft.trim()) return;
    setPending(true);
    try {
      const res = await editComment(comment.id, editDraft.trim(), revalidatePathTarget);
      if (res.success) {
        onUpdated(res.data);
        setEditing(false);
      } else {
        addToast(res.error ?? "Gagal menyimpan perubahan", "error");
      }
    } catch (err) {
      addToast(err.message ?? "Gagal menyimpan perubahan", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
        {getInitials(comment.authorName)}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.75">
          <strong className="text-[13px] font-medium text-foreground">{comment.authorName}</strong>
          <span className="text-[11px] text-foreground-subtle">{formatDateTime(comment.createdAt)}</span>
          {comment.editedAt && (
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="cursor-pointer border-0 bg-transparent p-0 text-[11px] font-medium text-accent underline"
            >
              diedit
            </button>
          )}
          {canEdit && !editing && (
            <button
              type="button"
              onClick={() => { setEditDraft(comment.content); setEditing(true); }}
              className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-medium text-accent underline"
            >
              <Pencil className="h-2.5 w-2.5" />
              edit
            </button>
          )}
        </div>

        {historyOpen && comment.editedAt && (
          <div className="my-1.5 flex flex-col gap-2 rounded-md border-l-2 border-border bg-surface-hover px-2.5 py-2">
            {comment.edits.map((edit) => (
              <div key={edit.id} className="flex flex-col gap-0.5">
                <span className="text-[11px] text-foreground-subtle">{formatDateTime(edit.editedAt)}</span>
                <p className="text-[13px] leading-[1.55] text-foreground-muted">{edit.previousContent}</p>
              </div>
            ))}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-foreground-subtle">{formatDateTime(comment.editedAt)} (terbaru)</span>
              <p className="text-[13px] leading-[1.55] text-foreground-muted">{comment.content}</p>
            </div>
          </div>
        )}

        {editing ? (
          <div className="mt-1 flex flex-col gap-2">
            <textarea
              rows={2}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              className={TEXTAREA_CLASSES}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="neutral" size="sm" onClick={() => setEditing(false)}>Batal</Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={!editDraft.trim() || pending}>
                {pending ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] leading-[1.55] text-foreground">{comment.content}</p>
        )}
      </div>
    </div>
  );
}
