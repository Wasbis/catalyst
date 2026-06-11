"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function ShellWrapper({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`shell ${collapsed ? "collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      {children}
    </div>
  );
}
