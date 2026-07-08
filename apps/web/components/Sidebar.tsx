import {
  LayoutDashboard, Sparkles, Users, MessageSquare, UsersRound,
  Share2, Megaphone, MessageCircle, Phone, ListChecks, Plug, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Item { label: string; icon: LucideIcon; active?: boolean }

const main: Item[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Generate Leads", icon: Sparkles },
  { label: "Manage Leads", icon: Users },
  { label: "Engage Leads", icon: MessageSquare },
];

const control: Item[] = [
  { label: "Team Members", icon: UsersRound },
  { label: "Lead Sources", icon: Share2, active: true },
  { label: "Ad Accounts", icon: Megaphone },
  { label: "WhatsApp Account", icon: MessageCircle },
  { label: "Tele Calling", icon: Phone },
  { label: "CRM Fields", icon: ListChecks },
  { label: "API Center", icon: Plug },
];

function NavList({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-1">
      {items.map(({ label, icon: Icon, active }) => (
        <li key={label}>
          <span
            className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm transition ${
              active
                ? "bg-brand-teal/10 font-semibold text-brand-teal"
                : "text-ink-soft hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Icon size={18} />
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-surface">
          <Share2 size={16} />
        </div>
        <span className="text-lg font-bold text-ink">GrowEasy</span>
      </div>

      <div className="mx-4 mb-4 flex items-center gap-3 rounded-card border border-line px-3 py-2.5">
        <div className="h-8 w-8 rounded-md bg-brand-teal/20" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">VK Test</p>
          <p className="text-[11px] uppercase tracking-wide text-ink-soft">Owner</p>
        </div>
        <ChevronRight size={16} className="text-ink-soft" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-6">
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Main</p>
          <NavList items={main} />
        </div>
        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Control Center</p>
          <NavList items={control} />
        </div>
      </nav>
    </aside>
  );
}
