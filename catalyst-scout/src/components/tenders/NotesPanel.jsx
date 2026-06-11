"use client";

import { useActionState, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { addTenderNote } from "@/actions/tenderActions";

function parseNotes(raw) {
  if (!raw) return [];
  return raw
    .split("\n---\n")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      // Format: [tanggal] nama: isi
      const match = entry.match(/^\[(.+?)\]\s+(.+?):\s+([\s\S]*)$/);
      if (match) return { date: match[1], author: match[2], body: match[3].trim() };
      return { date: null, author: null, body: entry };
    });
}

const initialState = { error: null, success: false };

export default function NotesPanel({ tender }) {
  const [text, setText] = useState("");
  const notes = parseNotes(tender.notes);

  const [state, formAction, pending] = useActionState(async (prev, formData) => {
    const note = formData.get("note");
    const result = await addTenderNote(tender.id, note);
    if (result.success) {
      setText("");
      return { error: null, success: true };
    }
    return { error: result.error, success: false };
  }, initialState);

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle mb-3">
        Catatan
      </p>

      {/* Note list */}
      {notes.length === 0 ? (
        <p className="text-xs text-foreground-subtle mb-3">Belum ada catatan.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {notes.map((note, i) => (
            <div key={i} className="rounded-lg bg-surface-hover px-3 py-2.5">
              {note.date && (
                <p className="text-[10px] text-foreground-subtle mb-1">
                  {note.author && <span className="font-medium text-foreground-muted">{note.author}</span>}
                  {" · "}
                  {note.date}
                </p>
              )}
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add note form */}
      <form action={formAction} className="space-y-2">
        <textarea
          name="note"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Tambah catatan..."
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {state?.error && (
          <p className="text-xs text-danger">{state.error}</p>
        )}
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={pending || !text.trim()}
        >
          {pending ? "Menyimpan..." : "Simpan Catatan"}
        </Button>
      </form>
    </Card>
  );
}
