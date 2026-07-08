"use client";

import { FileText, X } from "lucide-react";
import type { useImport } from "../hooks/useImport";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Dropzone } from "./Dropzone";
import { PreviewTable } from "./PreviewTable";
import { ProcessingPanel } from "./ProcessingPanel";

type ImportApi = ReturnType<typeof useImport>;

interface Props {
  open: boolean;
  onClose: () => void;
  imp: ImportApi;
}

function prettySize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImportModal({ open, onClose, imp }: Props) {
  const { phase, file, preview, progress, error } = imp;
  const busy = phase === "processing";

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!busy}
      title="Import Leads via CSV"
      subtitle="Upload a CSV file to bulk import leads into your system."
    >
      {phase === "idle" && <Dropzone onFile={imp.selectFile} error={error} />}

      {phase === "preview" && preview && file && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-card border border-line px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-teal/10 text-brand-teal">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
              <p className="text-xs text-ink-soft">{prettySize(file.size)}</p>
            </div>
            <button onClick={imp.reset} aria-label="Remove file" className="text-ink-soft hover:text-ink">
              <X size={18} />
            </button>
          </div>

          <PreviewTable headers={preview.headers} rows={preview.rows} />
          <p className="text-xs text-ink-soft">
            Showing {preview.rows.length} {preview.truncated ? "of many " : ""}rows. No AI has run yet.
          </p>

          {error && (
            <p className="rounded-control bg-status-bad-bg px-3 py-2 text-sm text-status-bad">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={imp.reset}>Cancel</Button>
            <Button onClick={imp.confirmImport}>Confirm import</Button>
          </div>
        </div>
      )}

      {phase === "processing" && progress && <ProcessingPanel progress={progress} />}

      {phase === "error" && (
        <div className="space-y-4 py-2 text-center">
          <p className="rounded-control bg-status-bad-bg px-3 py-3 text-sm text-status-bad">{error}</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={imp.reset}>Start over</Button>
            <Button onClick={imp.confirmImport}>Retry</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
