"use client";

import { useState } from "react";
import { updateDocumentTemplate } from "@/actions/documentTemplateActions";
import { useToast } from "@/components/ui/ToastProvider";
import Button from "@/components/ui/Button";

export default function AiSectionsEditor({ templateId, initialSections = [], headingSuggestions = [], onSaved }) {
  const { addToast } = useToast();
  const [selected, setSelected] = useState(() => new Set(initialSections.map((s) => s.toUpperCase())));
  const [pending, setPending] = useState(false);

  const options = Array.from(new Set([
    ...headingSuggestions.map((h) => h.toUpperCase()),
    ...selected,
  ]));

  function toggle(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  async function handleSave() {
    setPending(true);
    const result = await updateDocumentTemplate(templateId, { ai_sections: Array.from(selected) });
    setPending(false);
    if (result.success) {
      addToast("AI sections berhasil disimpan", "success");
      onSaved?.();
    } else {
      addToast(result.error ?? "Gagal menyimpan AI sections", "error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-foreground-muted">
        Centang section yang akan digenerate AI (token OpenAI). Section yang tidak dicentang = data-fill/static (0 token).
      </p>
      {options.length === 0 ? (
        <p className="text-sm text-foreground-subtle">Tidak ada heading terdeteksi — semua section jadi data-fill/static.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {options.map((name) => (
            <label key={name} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selected.has(name)}
                onChange={() => toggle(name)}
                className="rounded border-border text-accent focus:ring-accent"
              />
              {name}
            </label>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={handleSave} loading={pending}>Simpan AI Sections</Button>
      </div>
    </div>
  );
}
