"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getTheme, setTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setThemeState(getTheme()), 0);
    return () => clearTimeout(id);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  if (theme === null) {
    return <div className="w-8 h-8" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-all duration-120 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
