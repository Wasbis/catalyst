"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProposalSetup from "./ProposalSetup";
import ProposalEditor from "./ProposalEditor";
import { generateProposalDraft } from "@/actions/aiActions";

export default function ProposalWizard({ tenderResultId, initialDraftId }) {
  const router = useRouter();
  const [draftId, setDraftId] = useState(initialDraftId);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (payload) => {
    setIsGenerating(true);
    const res = await generateProposalDraft({
      ...payload,
      tender_result_id: tenderResultId,
    });
    setIsGenerating(false);

    if (res.success && res.data?.draft_id) {
      setDraftId(res.data.draft_id);
      router.refresh(); // Refresh RSC cache
    } else {
      alert("Gagal men-generate proposal: " + (res.error || res.data?.detail || "Unknown error"));
    }
  };

  const handleReset = () => {
    if (confirm("Draft saat ini akan ditimpa jika Anda membuat draft baru. Lanjutkan?")) {
      setDraftId(null);
    }
  };

  if (draftId) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <button onClick={handleReset} className="btn btn-sm bg-white text-danger border border-danger hover:bg-red-50">
            Mulai Ulang (Generate Baru)
          </button>
        </div>
        <ProposalEditor draftId={draftId} />
      </div>
    );
  }

  return <ProposalSetup onGenerate={handleGenerate} isGenerating={isGenerating} />;
}
