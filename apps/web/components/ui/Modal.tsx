"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  dismissible?: boolean;
}

export function Modal({ open, onClose, title, subtitle, children, dismissible = true }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissible && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => dismissible && onClose()}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-card bg-surface shadow-modal">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          {dismissible && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1 text-ink-soft hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
