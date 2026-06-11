"use client";

import { useState, useEffect } from "react";
import { createManualTender } from "@/actions/tenderActions";
import { useToast } from "@/components/ui/ToastProvider";
import { VALID_TENDER_STATUSES } from "@/lib/tenderStatus";

const SOURCE_OPTIONS = [
  { value: "civd",    label: "CIVD · SKK Migas" },
  { value: "geodipa", label: "GeoDipa" },
  { value: "manual",  label: "Input Manual" },
];

export default function ManualInputModal({ open, onClose, onCreated }) {
  const { addToast } = useToast();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    setPending(true);
    const result = await createManualTender(fd);
    setPending(false);
    if (result.success) {
      addToast("Tender berhasil ditambahkan", "success");
      onCreated?.();
      onClose();
    } else {
      addToast(result.error ?? "Gagal menyimpan", "error");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head">
          <div>
            <h3 className="modal-title">Input Manual Tender</h3>
            <p className="modal-sub">Tambah tender yang tidak terdeteksi oleh scraper otomatis</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* Title - span 2 */}
              <div className="field span-2">
                <label className="field-label" htmlFor="mi-title">Judul Tender *</label>
                <input id="mi-title" name="title" required className="input" placeholder="Contoh: Jasa Konsultansi FEED Fasilitas Produksi..." />
              </div>

              {/* Agency */}
              <div className="field">
                <label className="field-label" htmlFor="mi-agency">Instansi / Klien *</label>
                <input id="mi-agency" name="agency" required className="input" placeholder="PT Pertamina Hulu Mahakam" />
              </div>

              {/* Source */}
              <div className="field">
                <label className="field-label" htmlFor="mi-source">Sumber</label>
                <div className="select-wrap">
                  <select id="mi-source" name="source" className="input select" defaultValue="manual">
                    {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Budget */}
              <div className="field">
                <label className="field-label" htmlFor="mi-budget">Estimasi Nilai (Rp)</label>
                <input id="mi-budget" name="budgetEstimated" type="number" min="0" className="input" placeholder="4800000000" />
              </div>

              {/* Deadline */}
              <div className="field">
                <label className="field-label" htmlFor="mi-deadline">Tenggat</label>
                <input id="mi-deadline" name="deadlineDate" type="date" className="input" />
              </div>

              {/* URL */}
              <div className="field span-2">
                <label className="field-label" htmlFor="mi-url">URL Sumber</label>
                <input id="mi-url" name="sourceUrl" type="url" className="input" placeholder="https://..." />
              </div>

              {/* Status */}
              <div className="field">
                <label className="field-label" htmlFor="mi-status">Status Awal</label>
                <div className="select-wrap">
                  <select id="mi-status" name="status" className="input select" defaultValue="DITEMUKAN">
                    {VALID_TENDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <svg className="select-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Description */}
              <div className="field span-2">
                <label className="field-label" htmlFor="mi-desc">Deskripsi / Persyaratan</label>
                <textarea id="mi-desc" name="description" className="input" rows={4} style={{ resize: "vertical", fontFamily: "inherit", fontSize: 13 }} placeholder="Tuliskan deskripsi singkat dan persyaratan utama tender ini..." />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-foot">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">Batal</button>
            <button type="submit" disabled={pending} className="btn btn-primary btn-md">
              {pending ? "Menyimpan..." : "Simpan Tender"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
