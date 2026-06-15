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
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <h2 className="m-0 text-base font-medium text-foreground">Master KBLI</h2>
        <p className="mt-1 text-[13px] text-foreground-muted">{kblis.length} kode KBLI terdaftar</p>
      </div>

      <div className="shrink-0">
        <PdfImportFlow />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-[14px] border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-border bg-surface text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                <th className="px-4 py-3 font-medium">Kode KBLI</th>
                <th className="px-4 py-3 font-medium">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {kblis.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-foreground-subtle">Belum ada data KBLI. Jalankan seed terlebih dahulu.</td></tr>
              ) : (
                kblis.map((k) => (
                  <tr key={k.id ?? k.kbliCode} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="px-4 py-3 align-top">
                      <span className="rounded-[5px] bg-accent-soft px-2 py-0.5 font-mono text-[12.5px] font-medium text-accent">{k.kbliCode}</span>
                    </td>
                    <td className="max-w-120 px-4 py-3 align-top text-foreground">{k.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
