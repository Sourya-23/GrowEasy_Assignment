import type { CrmStatus } from "@groweasy/shared";
import { CRM_STATUS_LABELS } from "@groweasy/shared";

const tone: Record<CrmStatus | "", { bg: string; fg: string; label: string }> = {
  GOOD_LEAD_FOLLOW_UP: { bg: "bg-status-good-bg", fg: "text-status-good", label: CRM_STATUS_LABELS.GOOD_LEAD_FOLLOW_UP },
  SALE_DONE:           { bg: "bg-status-sale-bg", fg: "text-status-sale", label: CRM_STATUS_LABELS.SALE_DONE },
  DID_NOT_CONNECT:     { bg: "bg-status-neutral-bg", fg: "text-status-neutral", label: CRM_STATUS_LABELS.DID_NOT_CONNECT },
  BAD_LEAD:            { bg: "bg-status-bad-bg", fg: "text-status-bad", label: CRM_STATUS_LABELS.BAD_LEAD },
  "":                  { bg: "bg-status-neutral-bg", fg: "text-status-neutral", label: "Unset" },
};

export function StatusBadge({ status }: { status: CrmStatus | "" }) {
  const t = tone[status] ?? tone[""];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${t.bg} ${t.fg}`}>
      {t.label}
    </span>
  );
}
