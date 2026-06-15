import { notFound } from "next/navigation";
import { getProjectById } from "@/actions/projectActions";
import { getDocumentTemplates } from "@/actions/documentTemplateActions";
import { getCurrentUser } from "@/lib/auth";
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
  const user = await getCurrentUser();

  const templatesResult = await getDocumentTemplates();
  const activeDocumentTypes = templatesResult.success
    ? [...new Set(templatesResult.data.filter((t) => t.is_active).map((t) => t.document_type))]
    : [];

  return (
    <div className="h-full overflow-y-auto">
      <ProjectDetailClient
        project={toJSONSafe(project)}
        currentUserId={user?.id}
        activeDocumentTypes={activeDocumentTypes}
      />
    </div>
  );
}
