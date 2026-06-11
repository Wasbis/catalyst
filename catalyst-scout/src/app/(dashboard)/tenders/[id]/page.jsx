import { notFound } from "next/navigation";
import { getTenderById } from "@/actions/tenderActions";
import { toJSONSafe } from "@/lib/serialize";
import TenderDetailClient from "@/components/tenders/TenderDetailClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const tender = await getTenderById(id);
  return { title: tender ? `${tender.title} — Catalyst` : "Tender tidak ditemukan" };
}

export default async function TenderDetailPage({ params }) {
  const { id } = await params;
  const tender = await getTenderById(id);
  if (!tender) notFound();
  return <TenderDetailClient tender={toJSONSafe(tender)} />;
}
