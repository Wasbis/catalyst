"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectTask, updateProjectTaskStatus, deleteProjectTask } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDate } from "@/lib/formatters";
import { VALID_TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/projectStatus";

const TASK_STATUS_BADGE = {
  todo: "badge-slate",
  in_progress: "badge-blue",
  done: "badge-green",
};

export default function ProjectTaskList({ projectId, tasks }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);
    const res = await createProjectTask(projectId, fd);
    setPending(false);
    if (res.success) {
      addToast("Tugas ditambahkan", "success");
      e.target.reset();
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal menambah tugas", "error");
    }
  }

  async function handleCycleStatus(task) {
    const idx = VALID_TASK_STATUSES.indexOf(task.status);
    const next = VALID_TASK_STATUSES[(idx + 1) % VALID_TASK_STATUSES.length];
    const res = await updateProjectTaskStatus(task.id, next);
    if (res.success) router.refresh();
    else addToast(res.error ?? "Gagal mengubah status tugas", "error");
  }

  async function handleDelete(task) {
    const res = await deleteProjectTask(task.id);
    if (res.success) {
      addToast("Tugas dihapus", "success");
      router.refresh();
    } else {
      addToast(res.error ?? "Gagal menghapus tugas", "error");
    }
  }

  return (
    <div className="panel">
      <div className="panel-head"><h3>Tugas Admin</h3></div>

      {tasks.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--foreground-subtle)" }}>Belum ada tugas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map((task) => (
            <div key={task.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{task.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--foreground-muted)" }}>
                  {task.assignee && `${task.assignee} · `}
                  {task.dueDate ? `Tenggat ${formatDate(task.dueDate)}` : "Tanpa tenggat"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => handleCycleStatus(task)}
                  className={`badge ${TASK_STATUS_BADGE[task.status] ?? "badge-slate"}`}
                  style={{ border: "none", cursor: "pointer" }}
                  title="Klik untuk ubah status"
                >
                  {TASK_STATUS_LABELS[task.status] ?? task.status}
                </button>
                <button onClick={() => handleDelete(task)} className="icon-btn" style={{ width: 26, height: 26 }} aria-label="Hapus tugas">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 180 }}>
          <label className="field-label">Judul Tugas</label>
          <input name="title" required className="input" placeholder="Mis. Siapkan dokumen BAST" />
        </div>
        <div className="field" style={{ width: 160 }}>
          <label className="field-label">PIC</label>
          <input name="assignee" className="input" placeholder="Nama" />
        </div>
        <div className="field" style={{ width: 160 }}>
          <label className="field-label">Tenggat</label>
          <input name="dueDate" type="date" className="input" />
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary btn-md">
          {pending ? "Menyimpan…" : "Tambah"}
        </button>
      </form>
    </div>
  );
}
