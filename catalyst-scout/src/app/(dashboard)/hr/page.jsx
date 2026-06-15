import { getEmployees } from "@/actions/hrActions";
import { toJSONSafe } from "@/lib/serialize";
import EmployeeFilterBar from "@/components/hr/EmployeeFilterBar";
import EmployeeTable from "@/components/hr/EmployeeTable";

export const metadata = { title: "Karyawan — Project Maker by Cliste" };

export default async function HrPage({ searchParams }) {
  const sp = await searchParams;

  const result = await getEmployees({
    isActive: sp.isActive === "" || sp.isActive === undefined ? undefined : sp.isActive === "true",
    keyword: sp.keyword || undefined,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <h2 className="m-0 text-base font-medium text-foreground">Karyawan</h2>
        <p className="mt-1 text-[13px] text-foreground-muted">
          Master data karyawan & dokumen pribadi (KTP, BPJS, Ijazah, KK, NPWP)
        </p>
      </div>

      <div className="shrink-0">
        <EmployeeFilterBar searchParams={sp} />
      </div>
      <EmployeeTable data={toJSONSafe(result.data)} scrollable />
    </div>
  );
}
