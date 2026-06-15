"use client";

import { useEffect, useMemo, useState } from "react";
import {
  scanTemplateFieldMapper,
  suggestTemplateFieldMapping,
  applyTemplateFieldMapping,
} from "@/actions/documentTemplateActions";
import { useToast } from "@/components/ui/ToastProvider";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

const GROUP_LABELS = {
  cover: "Cover / Text Box",
  header_footer: "Header & Footer",
  table: "Tabel",
  body: "Body / Paragraf",
};

const GROUP_ORDER = ["cover", "header_footer", "table", "body"];

// Body group biasanya sudah ditangani Methodology 1 (aiSections per Heading 1)
// — collapse default supaya UI tidak overload (ratusan paragraf).
const COLLAPSED_BY_DEFAULT = new Set(["table", "body"]);

function emptyRow() {
  return { classification: "static", search: "", jinjaTag: "", guideline: "" };
}

export default function FieldMapperEditor({ templateId, onClose }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [rows, setRows] = useState({}); // id -> {classification, search, jinjaTag, guideline}
  const [descriptions, setDescriptions] = useState({}); // id -> {description, fieldHint}
  const [filter, setFilter] = useState("");
  const [pending, setPending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await scanTemplateFieldMapper(templateId);
      if (!active) return;
      setLoading(false);
      if (!result.success) {
        addToast(result.error ?? "Gagal scan template", "error");
        return;
      }
      setCandidates(result.data.candidates ?? []);
      const initialRows = {};
      for (const m of result.data.existing_mapping ?? []) {
        const key = m.ids?.[0];
        if (!key) continue;
        initialRows[key] = {
          classification: m.classification ?? "static",
          search: m.search ?? "",
          jinjaTag: m.jinja_tag ?? "",
          guideline: m.guideline ?? "",
        };
      }
      setRows(initialRows);
    })();
    return () => { active = false; };
  }, [templateId, addToast]);

  const grouped = useMemo(() => {
    const byGroup = {};
    for (const c of candidates) {
      if (filter && !c.text.toLowerCase().includes(filter.toLowerCase())) continue;
      (byGroup[c.group] ??= []).push(c);
    }
    return byGroup;
  }, [candidates, filter]);

  function updateRow(id, patch) {
    setRows((prev) => ({ ...prev, [id]: { ...(prev[id] ?? emptyRow()), ...patch } }));
  }

  async function handleSuggest() {
    setSuggesting(true);
    const result = await suggestTemplateFieldMapping(templateId);
    setSuggesting(false);
    if (!result.success) {
      addToast(result.error ?? "Gagal mendapatkan saran AI", "error");
      return;
    }

    const { suggestions, usage } = result.data;
    const newRows = {};
    const newDescriptions = {};
    for (const s of suggestions) {
      newRows[s.id] = {
        classification: s.classification ?? "static",
        search: "",
        jinjaTag: s.jinjaTag ?? "",
        guideline: "",
      };
      newDescriptions[s.id] = { description: s.description ?? "", fieldHint: s.fieldHint ?? "" };
    }
    setRows((prev) => ({ ...prev, ...newRows }));
    setDescriptions(newDescriptions);

    const cost = usage?.estimated_cost_usd != null ? ` (~$${usage.estimated_cost_usd.toFixed(5)})` : "";
    addToast(
      `Saran AI diterapkan untuk ${suggestions.length} field. Token usage: ${usage?.total_tokens ?? "?"}${cost}.`,
      "success",
    );
  }

  async function handleApply() {
    const mappings = [];
    for (const c of candidates) {
      const row = rows[c.id];
      if (!row || row.classification === "static") continue;
      if (!row.jinjaTag?.trim()) {
        addToast(`Field "${c.text.slice(0, 40)}..." perlu Jinja tag (mis. {{ client_name }}).`, "error");
        return;
      }
      mappings.push({
        ids: c.ids,
        classification: row.classification,
        search: row.search?.trim() || null,
        jinja_tag: row.jinjaTag.trim(),
        guideline: row.guideline?.trim() || null,
      });
    }

    setPending(true);
    const result = await applyTemplateFieldMapping(templateId, mappings);
    setPending(false);
    if (result.success) {
      addToast(`Field mapping diterapkan (${mappings.length} field). Tagged template tersimpan.`, "success");
      onClose?.();
    } else {
      addToast(result.error ?? "Gagal menerapkan field mapping", "error");
    }
  }

  if (loading) {
    return <p className="text-sm text-foreground-subtle">Memuat candidate fields...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-foreground-muted">
        Tandai paragraf yang sumbernya <strong>data</strong> (DB, lewat tag Jinja2 mis. <code>{"{{ client_name }}"}</code>)
        atau <strong>ai</strong> (digenerate AI). Sisanya biarkan <strong>static</strong> (tidak diubah).
        &ldquo;Apply&rdquo; menulis copy template baru (<code>*_tagged.docx</code>) berisi tag Jinja2 — lihat
        document-templates/proposal-generator-strategy-v2.md.
      </p>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Cari teks candidate..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button type="button" variant="neutral" size="sm" onClick={handleSuggest} loading={suggesting}>
          Saran AI (klasifikasi otomatis)
        </Button>
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-foreground-subtle">Tidak ada teks terdeteksi di template ini.</p>
      ) : (
        GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => (
          <details key={group} open={!COLLAPSED_BY_DEFAULT.has(group) || filter}>
            <summary className="cursor-pointer py-1 text-sm font-medium text-foreground">
              {GROUP_LABELS[group] ?? group} ({grouped[group].length})
            </summary>
            <div className="flex flex-col gap-2 pl-1 pt-2">
              {grouped[group].map((c) => {
                const row = rows[c.id] ?? emptyRow();
                const desc = descriptions[c.id];
                return (
                  <div key={c.id} className="rounded-lg border border-border p-2.5">
                    <p className="mb-1 text-[13px] text-foreground" title={c.text}>
                      {c.text.length > 140 ? `${c.text.slice(0, 140)}...` : c.text}
                      {c.occurrences > 1 && (
                        <span className="ml-2 rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] text-foreground-subtle">
                          {c.occurrences}x
                        </span>
                      )}
                    </p>
                    {desc?.description && (
                      <p className="mb-2 text-[12px] italic text-foreground-subtle">
                        {desc.description}
                        {desc.fieldHint && ` (${desc.fieldHint})`}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        className="max-w-[120px]"
                        value={row.classification}
                        onChange={(e) => updateRow(c.id, { classification: e.target.value })}
                      >
                        <option value="static">static</option>
                        <option value="data">data</option>
                        <option value="ai">ai</option>
                      </Select>
                      {row.classification !== "static" && (
                        <>
                          <Input
                            placeholder="{{ jinja_tag }}"
                            value={row.jinjaTag}
                            onChange={(e) => updateRow(c.id, { jinjaTag: e.target.value })}
                            className="max-w-[200px]"
                          />
                          <Input
                            placeholder="(opsional) substring spesifik yang diganti"
                            value={row.search}
                            onChange={(e) => updateRow(c.id, { search: e.target.value })}
                            className="max-w-xs"
                          />
                        </>
                      )}
                      {row.classification === "ai" && (
                        <Input
                          placeholder="Guideline untuk AI (opsional)"
                          value={row.guideline}
                          onChange={(e) => updateRow(c.id, { guideline: e.target.value })}
                          className="max-w-xs"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ))
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="neutral" size="sm" onClick={onClose}>Tutup</Button>
        <Button type="button" size="sm" onClick={handleApply} loading={pending}>Apply Field Mapping</Button>
      </div>
    </div>
  );
}
