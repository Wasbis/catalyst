"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import {
  ENTITY_TYPE_LABELS,
  ACTION_LABELS,
  ACTION_BADGE_VARIANT,
  getEntityLink,
} from "@/lib/auditLogTypes";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";

function renderSummary(log) {
  if (log.changesJson) {
    return Object.entries(log.changesJson)
      .map(([field, { old, new: next }]) => `${field}: ${old ?? "—"} → ${next ?? "—"}`)
      .join(", ");
  }

  return log.metadata?.label ?? log.metadata?.name ?? log.metadata?.title ?? log.metadata?.docType ?? "—";
}

const COLUMNS = [
  {
    key: "createdAt",
    header: "Waktu",
    cellClassName: "px-4 py-3 text-foreground-muted whitespace-nowrap",
    render: (log) => formatDateTime(log.createdAt),
  },
  {
    key: "user",
    header: "User",
    cellClassName: "px-4 py-3 text-foreground",
    render: (log) => log.user?.name ?? "System",
  },
  {
    key: "action",
    header: "Action",
    render: (log) => (
      <Badge variant={ACTION_BADGE_VARIANT[log.action] ?? "neutral"} size="sm">
        {ACTION_LABELS[log.action] ?? log.action}
      </Badge>
    ),
  },
  {
    key: "entity",
    header: "Entity",
    cellClassName: "px-4 py-3 text-foreground-muted",
    render: (log) => {
      const entityLabel = ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType;
      const href = getEntityLink(log.entityType, log.entityId, log.metadata);
      return href ? (
        <Link href={href} className="hover:underline text-foreground">
          {entityLabel} #{log.entityId}
        </Link>
      ) : (
        <>{entityLabel} #{log.entityId}</>
      );
    },
  },
  {
    key: "summary",
    header: "Ringkasan",
    cellClassName: "px-4 py-3 text-foreground-muted max-w-[420px] truncate",
    render: (log) => renderSummary(log),
  },
];

export default function ActivityLogTable({ data, scrollable = false }) {
  return (
    <Table
      variant="panel"
      scrollable={scrollable}
      sticky={scrollable}
      columns={COLUMNS}
      data={data}
      emptyState={<EmptyState icon={History} title="Belum ada aktivitas tercatat." />}
    />
  );
}
