"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function ShellWrapper({ children, user }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} user={user} />
      {children}
    </div>
  );
}
