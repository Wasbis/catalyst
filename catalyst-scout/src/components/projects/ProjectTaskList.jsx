"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createProjectTask, updateProjectTaskStatus, deleteProjectTask } from "@/actions/projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDate } from "@/lib/formatters";
import { VALID_TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/projectStatus";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Button from "@/components/ui/Button";

const TASK_STATUS_BADGE = {
  todo: "neutral",
  in_progress: "info",
  done: "active",
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
    <div className="rounded-[14px] border border-border bg-surface px-5 py-4.5">
      <div className="mb-3.5"><h3 className="text-sm font-medium text-foreground">Tugas Admin</h3></div>

      {tasks.length === 0 ? (
        <p className="text-[13px] text-foreground-subtle">Belum ada tugas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2">
              <div>
                <div className="text-[13.5px] font-medium text-foreground">{task.title}</div>
                <div className="text-[11.5px] text-foreground-muted">
                  {task.assignee && `${task.assignee} · `}
                  {task.dueDate ? `Tenggat ${formatDate(task.dueDate)}` : "Tanpa tenggat"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleCycleStatus(task)} title="Klik untuk ubah status" className="cursor-pointer">
                  <Badge variant={TASK_STATUS_BADGE[task.status] ?? "neutral"}>
                    {TASK_STATUS_LABELS[task.status] ?? task.status}
                  </Badge>
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="flex h-6.5 w-6.5 items-center justify-center rounded text-foreground-muted hover:bg-surface-hover hover:text-foreground cursor-pointer"
                  aria-label="Hapus tugas"
                >
                  <Trash2 className="h-3.25 w-3.25" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-45 flex-1">
          <Label htmlFor="task-title">Judul Tugas</Label>
          <Input id="task-title" name="title" required placeholder="Mis. Siapkan dokumen BAST" />
        </div>
        <div className="w-40">
          <Label htmlFor="task-assignee">PIC</Label>
          <Input id="task-assignee" name="assignee" placeholder="Nama" />
        </div>
        <div className="w-40">
          <Label htmlFor="task-due">Tenggat</Label>
          <Input id="task-due" name="dueDate" type="date" />
        </div>
        <Button type="submit" loading={pending}>
          Tambah
        </Button>
      </form>
    </div>
  );
}
