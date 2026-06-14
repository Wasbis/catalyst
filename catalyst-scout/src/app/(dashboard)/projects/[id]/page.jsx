import { notFound } from "next/navigation";
import { getProjectById } from "@/actions/projectActions";
import { toJSONSafe } from "@/lib/serialize";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project ? `${project.name} — Project Maker by Catalyst` : "Proyek tidak ditemukan" };
}

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  return <ProjectDetailClient project={toJSONSafe(project)} />;
}
