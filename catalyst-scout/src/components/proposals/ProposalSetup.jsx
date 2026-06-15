"use client";

import { useState, useEffect } from "react";
import { getProposalTemplates } from "@/actions/aiActions";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export default function ProposalSetup({ onGenerate, isGenerating }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [useMasking, setUseMasking] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getProposalTemplates();
      if (res.success) {
        setTemplates(res.data || []);
        if (res.data?.length > 0) {
          setSelectedTemplate(res.data[0].id);
        }
      }
      setIsLoading(false);
    }
    setTimeout(load, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      template_id: selectedTemplate || null,
      company_name: companyName || null,
      use_masking: useMasking,
    });
  };

  return (
    <div className="mx-auto mt-8 max-w-xl rounded-[14px] border border-border bg-surface p-6">
      <h2 className="mb-4 text-xl font-medium text-foreground">Setup Proposal Baru</h2>
      <p className="mb-6 text-sm text-foreground-muted">
        Silakan pilih template awal dan masukkan detail perusahaan Anda untuk menghasilkan draft proposal menggunakan AI.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label>Template Proposal</Label>
          {isLoading ? (
            <p className="text-sm text-foreground-muted">Memuat template...</p>
          ) : (
            <Select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
              <option value="">Buat dari awal (Tanpa Template)</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </Select>
          )}
        </div>

        <div>
          <Label>Nama Perusahaan Anda (Opsional)</Label>
          <Input
            type="text"
            placeholder="Misal: PT Cliste Rekayasa Indonesia"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="useMasking"
            checked={useMasking}
            onChange={(e) => setUseMasking(e.target.checked)}
            className="rounded border-border text-accent focus:ring-accent"
          />
          <label htmlFor="useMasking" className="cursor-pointer select-none text-sm text-foreground">
            Gunakan Data Masking (Anonimisasi)
          </label>
        </div>

        <Button type="submit" loading={isGenerating} disabled={isLoading} className="mt-4 w-full justify-center">
          Generate Proposal
        </Button>
      </form>
    </div>
  );
}
