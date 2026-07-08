"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
      className="rounded-control border border-line p-2 text-ink-soft hover:bg-black/5 dark:hover:bg-white/5"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
