import { prisma } from "@/lib/prisma";
import ProposalWizard from "@/components/proposals/ProposalWizard";

export const metadata = {
  title: "Generate Proposal | Catalyst",
};

export default async function ProposalPage({ params }) {
  const tenderId = Number(params.id);

  // Cek apakah sudah ada draft untuk tender ini
  const existingDraft = await prisma.proposalDraft.findFirst({
    where: { tenderResultId: tenderId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ProposalWizard 
        tenderResultId={tenderId} 
        initialDraftId={existingDraft?.id || null} 
      />
    </div>
  );
}
