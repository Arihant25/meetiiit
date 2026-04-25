"use client";

import { useEffect, useState } from "react";

type Theme = "default" | "light" | "dark";

const LABELS: Record<Theme, string> = {
  default: "Auto",
  light: "Light",
  dark: "Dark",
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("default");

  useEffect(() => {
    const stored = localStorage.getItem("meetiiit_theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    if (t === "dark") root.classList.add("theme-dark");
    else if (t === "light") root.classList.add("theme-light");
    if (t === "default") localStorage.removeItem("meetiiit_theme");
    else localStorage.setItem("meetiiit_theme", t);
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {(["default", "light", "dark"] as Theme[]).map((t) => (
        <button
          key={t}
          onClick={() => apply(t)}
          className={theme === t ? "button-primary" : "button-secondary"}
          style={{ minWidth: 72 }}
        >
          {LABELS[t]}
        </button>
      ))}
    </div>
  );
}
