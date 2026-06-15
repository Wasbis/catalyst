import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import ProjectStatusBadge from "@/components/projects/ProjectStatusBadge";
import { formatDateTime } from "@/lib/formatters";

const SOURCE_TYPE_LABELS = {
  tender: "Tender",
  non_tender: "Non-Tender",
};

const COLUMNS = [
  {
    key: "name",
    header: "Proyek",
    render: (project) => (
      <Link href={`/projects/${project.id}`} className="font-medium text-foreground hover:text-accent">
        {project.name}
      </Link>
    ),
  },
  {
    key: "client",
    header: "Client",
    cellClassName: "px-4 py-3 align-top text-foreground-muted",
    render: (project) => project.client,
  },
  {
    key: "sourceType",
    header: "Sumber",
    render: (project) => (
      <Badge className="bg-surface-hover text-foreground-muted">
        {SOURCE_TYPE_LABELS[project.sourceType] ?? project.sourceType}
      </Badge>
    ),
  },
  {
    key: "poSoNumber",
    header: "PO/SO",
    cellClassName: "px-4 py-3 align-top text-foreground-muted",
    render: (project) => project.poSoNumber || "—",
  },
  {
    key: "status",
    header: "Status",
    render: (project) => <ProjectStatusBadge status={project.status} />,
  },
  {
    key: "createdAt",
    header: "Dibuat",
    cellClassName: "px-4 py-3 align-top text-foreground-muted",
    render: (project) => formatDateTime(project.createdAt),
  },
];

const THEAD_CLASS = "sticky top-0 z-10 border-b border-border bg-surface-hover text-xs font-medium uppercase tracking-wide text-foreground-subtle";

export default function ProjectTable({ data, sticky = false }) {
  return (
    <Table
      columns={COLUMNS}
      data={data}
      sticky={sticky}
      theadClassName={sticky ? THEAD_CLASS : undefined}
      emptyState={<EmptyState title="Belum ada proyek yang cocok dengan filter ini." />}
    />
  );
}
