import { notFound } from "next/navigation";
import { getTenderById } from "@/actions/tenderActions";
import { getCurrentUser } from "@/lib/auth";
import { toJSONSafe } from "@/lib/serialize";
import TenderDetailClient from "@/components/tenders/TenderDetailClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const tender = await getTenderById(id);
  return { title: tender ? `${tender.title} — Project Maker by Catalyst` : "Tender tidak ditemukan" };
}

export default async function TenderDetailPage({ params }) {
  const { id } = await params;
  const tender = await getTenderById(id);
  if (!tender) notFound();
  const user = await getCurrentUser();
  return (
    <div className="h-full overflow-y-auto">
      <TenderDetailClient tender={toJSONSafe(tender)} currentUserId={user?.id} />
    </div>
  );
}
