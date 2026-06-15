"use client";

import { useState } from "react";

export default function KanbanCardShell({ id, className = "", children }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(id));
        e.dataTransfer.effectAllowed = "move";
        // slight delay so ghost renders first
        setTimeout(() => setDragging(true), 0);
      }}
      onDragEnd={() => setDragging(false)}
      className={className}
    >
      {children({ isDragging: dragging })}
    </div>
  );
}
