import { notFound } from "next/navigation";
import { getEmployeeById } from "@/actions/hrActions";
import { toJSONSafe } from "@/lib/serialize";
import EmployeeDetailClient from "@/components/hr/EmployeeDetailClient";

export const metadata = { title: "Detail Karyawan — Project Maker by Cliste" };

export default async function HrDetailPage({ params }) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) notFound();

  return (
    <div className="h-full overflow-y-auto">
      <EmployeeDetailClient employee={toJSONSafe(employee)} />
    </div>
  );
}
