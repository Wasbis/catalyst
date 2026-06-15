"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

export function buildCardMap(items, validStatuses, fallbackStatus) {
  const map = {};
  validStatuses.forEach((s) => { map[s] = []; });
  items.forEach((item) => {
    const s = validStatuses.includes(item.status) ? item.status : fallbackStatus;
    map[s].push(item);
  });
  return map;
}

export function useKanbanBoard({ initialItems, updateStatusAction, statusLabels }) {
  const { addToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [dragOverCol, setDragOverCol] = useState(null);
  const undoStack = useRef([]);

  const handleStatusChange = useCallback(async (itemId, newStatus) => {
    const id = Number(itemId);
    const current = items.find((it) => it.id === id);
    if (!current || current.status === newStatus) return;

    undoStack.current.push([...items]);
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, status: newStatus } : it));

    const result = await updateStatusAction(id, newStatus);
    if (!result.success) {
      setItems(undoStack.current.pop());
      addToast(result.error ?? "Gagal mengubah status", "error");
    } else {
      addToast(`Status → ${statusLabels[newStatus] ?? newStatus}`, "success");
    }
  }, [items, addToast, updateStatusAction, statusLabels]);

  function handleDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  }

  function handleDrop(e, status) {
    e.preventDefault();
    setDragOverCol(null);
    if (!e || !status) return;
    const id = e.dataTransfer?.getData("text/plain");
    if (id) handleStatusChange(id, status);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null);
  }

  function undo() {
    if (!undoStack.current.length) return false;
    setItems(undoStack.current.pop());
    return true;
  }

  return { items, setItems, dragOverCol, handleStatusChange, handleDragOver, handleDrop, handleDragLeave, undo };
}
