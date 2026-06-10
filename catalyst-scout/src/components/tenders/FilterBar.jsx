"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { STATUS_LABELS, formatSource } from "@/lib/formatters";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";

const SOURCE_OPTIONS = ["civd", "geodipa", "manual"];
const DEBOUNCE_MS = 400;

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") ?? "");

  function pushParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const currentKeyword = searchParams.get("keyword") ?? "";
    const currentMinScore = searchParams.get("minScore") ?? "";
    if (keyword === currentKeyword && minScore === currentMinScore) return;

    const timeout = setTimeout(() => pushParams({ keyword, minScore }), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, minScore]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-40">
        <Select
          value={searchParams.get("source") ?? ""}
          onChange={(e) => pushParams({ source: e.target.value })}
        >
          <option value="">Semua Sumber</option>
          {SOURCE_OPTIONS.map((source) => (
            <option key={source} value={source}>
              {formatSource(source)}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-44">
        <Select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => pushParams({ status: e.target.value })}
        >
          <option value="">Semua Status</option>
          {VALID_TENDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-32">
        <Input
          type="number"
          min="0"
          max="100"
          placeholder="Skor min."
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
        />
      </div>

      <div className="min-w-48 flex-1">
        <Input
          type="text"
          placeholder="Cari judul, instansi, atau deskripsi..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
    </div>
  );
}
