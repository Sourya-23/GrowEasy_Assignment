"use client";

import { useRef, useState, type DragEvent } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { sampleUrl } from "../lib/api";

interface Props {
  onFile: (file: File) => void;
  error: string | null;
}

export function Dropzone({ onFile, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-card border-2 border-dashed px-6 py-12 text-center transition ${
          dragging ? "border-brand-teal bg-brand-teal/5" : "border-line hover:border-brand-teal/60"
        }`}
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-card border border-line text-brand-teal">
          <UploadCloud size={26} />
        </div>
        <p className="text-base font-bold text-ink">Drop your CSV file here</p>
        <p className="mt-1 text-sm text-ink-soft">or click to browse files</p>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black/[0.03] px-3 py-1 text-xs text-ink-soft dark:bg-white/5">
          <FileText size={13} /> Supported file: .csv (max 5MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-control bg-status-bad-bg px-3 py-2 text-sm text-status-bad">
          {error}
        </p>
      )}

      <div className="mt-4 text-center">
        <a
          href={sampleUrl}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal hover:underline"
        >
          <FileText size={15} /> Download Sample CSV Template
        </a>
      </div>
    </div>
  );
}
