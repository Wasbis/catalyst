"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { bulkCreateKbli } from "@/actions/kbliActions";

export default function PdfImportFlow({ onImportSuccess }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("upload"); // upload | preview
  const [extractedData, setExtractedData] = useState([]);
  const [selectedCodes, setSelectedCodes] = useState(new Set());

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
    } else {
      addToast("Silakan pilih file PDF yang valid.", "error");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      addToast("Pilih file PDF NIB terlebih dahulu.", "error");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/kbli/import-preview", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Gagal mengekstrak file.");
      }

      if (resData.status === "warning") {
        addToast(resData.message, "info");
      }

      const items = resData.data || [];
      setExtractedData(items);
      
      // Auto select all by default
      const defaultSelected = new Set(items.map((i) => i.kbli_code));
      setSelectedCodes(defaultSelected);
      
      setStage("preview");
      addToast(`Berhasil mendeteksi ${items.length} KBLI dari PDF.`, "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (code) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedCodes.size === extractedData.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(extractedData.map((i) => i.kbli_code)));
    }
  };

  const handleConfirmImport = async () => {
    if (selectedCodes.size === 0) {
      addToast("Pilih minimal satu KBLI untuk di-import.", "error");
      return;
    }

    setLoading(true);
    const itemsToImport = extractedData
      .filter((i) => selectedCodes.has(i.kbli_code))
      .map((i) => ({
        kbliCode: i.kbli_code,
        description: i.description,
        category: "NIB IMPORT",
      }));

    try {
      const res = await bulkCreateKbli(itemsToImport);
      if (res.success) {
        addToast(`Berhasil menyimpan ${res.count} KBLI baru ke database!`, "success");
        setStage("upload");
        setFile(null);
        setExtractedData([]);
        setSelectedCodes(new Set());
        router.refresh();
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        throw new Error(res.error || "Gagal meng-import.");
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import KBLI Otomatis dari NIB PDF
        </h2>
        {stage === "preview" && (
          <button
            onClick={() => {
              setStage("upload");
              setFile(null);
            }}
            className="text-xs text-foreground-subtle hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Unggah
          </button>
        )}
      </div>

      {stage === "upload" ? (
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-accent/50 rounded-xl cursor-pointer py-6 px-4 bg-background-alt/50 hover:bg-background-alt transition-colors duration-200">
              <svg className="h-8 w-8 text-foreground-subtle mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-foreground text-center">
                {file ? file.name : "Pilih atau Seret File PDF NIB"}
              </span>
              <span className="text-xs text-foreground-subtle mt-1">Hanya file .pdf</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} disabled={loading} />
            </label>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full md:w-auto h-11 px-6 rounded-lg font-medium text-sm text-foreground bg-accent hover:bg-accent-hover active:bg-accent-active disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Mengekstrak...
              </>
            ) : (
              "Ekstrak KBLI"
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-subtle">
              Terdeteksi <strong>{extractedData.length}</strong> KBLI. Pilih mana yang akan di-import ke Master.
            </span>
            <button
              onClick={handleToggleAll}
              className="text-xs text-accent hover:underline font-medium"
            >
              {selectedCodes.size === extractedData.length ? "Batal Pilih Semua" : "Pilih Semua"}
            </button>
          </div>

          <div className="border border-border/60 rounded-lg overflow-hidden max-h-80 overflow-y-auto bg-background/50">
            {extractedData.length === 0 ? (
              <div className="p-6 text-center text-sm text-foreground-subtle">
                Tidak ada KBLI valid yang terdeteksi di dokumen ini.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-background-alt border-b border-border/50 text-foreground-subtle text-xs">
                    <th className="p-3 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCodes.size === extractedData.length}
                        onChange={handleToggleAll}
                        className="rounded border-border/60 text-accent focus:ring-accent"
                      />
                    </th>
                    <th className="p-3 w-28">Kode KBLI</th>
                    <th className="p-3">Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {extractedData.map((item) => (
                    <tr
                      key={item.kbli_code}
                      onClick={() => handleToggleSelect(item.kbli_code)}
                      className="hover:bg-background-alt/30 cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCodes.has(item.kbli_code)}
                          onChange={() => handleToggleSelect(item.kbli_code)}
                          className="rounded border-border/60 text-accent focus:ring-accent"
                        />
                      </td>
                      <td className="p-3 font-semibold text-foreground">{item.kbli_code}</td>
                      <td className="p-3 text-foreground-subtle">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setStage("upload");
                setFile(null);
                setExtractedData([]);
                setSelectedCodes(new Set());
              }}
              className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-background-alt transition-colors duration-200"
              disabled={loading}
            >
              Batal
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={selectedCodes.size === 0 || loading}
              className="px-5 py-2 rounded-lg font-medium text-sm text-foreground bg-accent hover:bg-accent-hover active:bg-accent-active disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2 cursor-pointer shadow-md"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Import ({selectedCodes.size}) KBLI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
