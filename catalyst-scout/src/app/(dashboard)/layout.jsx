import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ShellWrapper from "@/components/layout/ShellWrapper";
import Topbar from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ShellWrapper>
      <div className="main-area">
        <Topbar user={user} />
        <main className="page-content">{children}</main>
      </div>
    </ShellWrapper>
  );
}
