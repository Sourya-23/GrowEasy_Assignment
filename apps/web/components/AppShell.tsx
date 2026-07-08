import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

interface Props { title: string; subtitle?: string; children: ReactNode }

export function AppShell({ title, subtitle, children }: Props) {
  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="flex items-start justify-between gap-4 px-6 py-6 lg:px-10">
          <div>
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <ThemeToggle />
        </header>
        <div className="px-6 pb-16 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
