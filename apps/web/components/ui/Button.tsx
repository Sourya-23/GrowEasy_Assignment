"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-brand-orange text-white hover:brightness-95 disabled:bg-brand-orange-disabled disabled:cursor-not-allowed",
  secondary:
    "border border-brand-teal text-brand-teal hover:bg-brand-teal/5 disabled:opacity-50",
  ghost:
    "border border-line text-ink hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50",
};

export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-control px-5 py-2.5 text-sm font-semibold transition ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
