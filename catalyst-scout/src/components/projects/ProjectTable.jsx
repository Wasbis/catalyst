import Link from "next/link";
import Badge from "@/components/ui/Badge";
import ProjectStatusBadge from "@/components/projects/ProjectStatusBadge";
import { formatDate } from "@/lib/formatters";

const TABLE_HEADERS = ["Proyek", "Client", "Sumber", "PO/SO", "Status", "Dibuat"];

const SOURCE_TYPE_LABELS = {
  tender: "Tender",
  non_tender: "Non-Tender",
};

export default function ProjectTable({ data }) {
  if (data.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-foreground-muted">
        Belum ada proyek yang cocok dengan filter ini.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            {TABLE_HEADERS.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectRow({ project }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-hover">
      <td className="px-4 py-3 align-top">
        <Link href={`/projects/${project.id}`} className="font-medium text-foreground hover:text-accent">
          {project.name}
        </Link>
      </td>
      <td className="px-4 py-3 align-top text-foreground-muted">{project.client}</td>
      <td className="px-4 py-3 align-top">
        <Badge className="bg-surface-hover text-foreground-muted">
          {SOURCE_TYPE_LABELS[project.sourceType] ?? project.sourceType}
        </Badge>
      </td>
      <td className="px-4 py-3 align-top text-foreground-muted">{project.poSoNumber || "—"}</td>
      <td className="px-4 py-3 align-top">
        <ProjectStatusBadge status={project.status} />
      </td>
      <td className="px-4 py-3 align-top text-foreground-muted">{formatDate(project.createdAt)}</td>
    </tr>
  );
}
