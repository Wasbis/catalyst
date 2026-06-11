"use client";

import { useState, useEffect } from "react";
import { getProposalTemplates } from "@/actions/aiActions";

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
    load();
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
    <div className="card p-6 max-w-xl mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">Setup Proposal Baru</h2>
      <p className="text-sm text-foreground-muted mb-6">
        Silakan pilih template awal dan masukkan detail perusahaan Anda untuk menghasilkan draft proposal menggunakan AI.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="settings-label">Template Proposal</label>
          {isLoading ? (
            <p className="text-sm text-foreground-muted">Memuat template...</p>
          ) : (
            <select 
              className="form-input w-full mt-1" 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Buat dari awal (Tanpa Template)</option>
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="settings-label">Nama Perusahaan Anda (Opsional)</label>
          <input 
            type="text" 
            className="form-input w-full mt-1" 
            placeholder="Misal: PT Cliste Rekayasa Indonesia"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox" 
            id="useMasking" 
            checked={useMasking} 
            onChange={(e) => setUseMasking(e.target.checked)}
            className="rounded border-gray-300 text-accent focus:ring-accent"
          />
          <label htmlFor="useMasking" className="text-sm cursor-pointer select-none">
            Gunakan Data Masking (Anonimisasi)
          </label>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary mt-4 w-full"
          disabled={isGenerating || isLoading}
        >
          {isGenerating ? "Sedang Men-generate..." : "Generate Proposal"}
        </button>
      </form>
    </div>
  );
}
