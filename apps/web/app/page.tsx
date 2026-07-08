"use client";

import { useEffect, useState } from "react";
import { Upload, Sparkles } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ImportModal } from "../components/ImportModal";
import { ResultsSection } from "../components/ResultsSection";
import { Button } from "../components/ui/Button";
import { useImport } from "../hooks/useImport";

export default function Page() {
  const imp = useImport();
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    imp.reset();
    setModalOpen(true);
  };

  // close the modal once results are ready
  useEffect(() => {
    if (imp.phase === "results") setModalOpen(false);
  }, [imp.phase]);

  return (
    <AppShell
      title="Lead Sources"
      subtitle="Connect, manage, and import all your lead channels from one dashboard."
    >
      {imp.phase === "results" && imp.result ? (
        <ResultsSection result={imp.result} onReset={openModal} />
      ) : (
        <div className="rounded-card border border-line bg-surface p-10 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-card bg-brand-teal/10 text-brand-teal">
            <Sparkles size={26} />
          </div>
          <h2 className="text-xl font-bold text-ink">Import leads from any CSV</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Facebook, Google Ads, Excel exports, agency sheets. Our AI maps whatever columns you have
            into clean GrowEasy CRM records.
          </p>
          <div className="mt-6">
            <Button onClick={openModal}>
              <Upload size={16} /> Import Leads via CSV
            </Button>
          </div>
        </div>
      )}

      <ImportModal open={modalOpen} onClose={() => setModalOpen(false)} imp={imp} />
    </AppShell>
  );
}
