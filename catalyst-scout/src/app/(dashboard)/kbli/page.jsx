import { prisma } from "@/lib/prisma";
import PdfImportFlow from "@/components/kbli/PdfImportFlow";

export const metadata = { title: "KBLI — Project Maker by Catalyst" };

async function getKbli() {
  try {
    return await prisma.masterKbli.findMany({ orderBy: { kbliCode: "asc" } });
  } catch { return []; }
}

export default async function KbliPage() {
  const kblis = await getKbli();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Master KBLI</h2>
          <p style={{ fontSize: 13, color: "var(--foreground-muted)", margin: "4px 0 0" }}>{kblis.length} kode KBLI terdaftar</p>
        </div>
      </div>

      {/* PDF Import Flow component */}
      <PdfImportFlow />


      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="kbli-table">
          <thead>
            <tr>
              <th>Kode KBLI</th>
              <th>Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            {kblis.length === 0 ? (
              <tr><td colSpan={2} style={{ textAlign: "center", color: "var(--foreground-subtle)", padding: 32 }}>Belum ada data KBLI. Jalankan seed terlebih dahulu.</td></tr>
            ) : (
              kblis.map((k) => (
                <tr key={k.id ?? k.kbliCode}>
                  <td><span className="kbli-code">{k.kbliCode}</span></td>
                  <td className="kbli-desc-cell">{k.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
