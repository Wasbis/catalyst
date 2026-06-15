import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ShellWrapper from "@/components/layout/ShellWrapper";
import Topbar from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ShellWrapper user={user}>
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        <Topbar user={user} />
        <main className="w-full flex-1 min-h-0 overflow-hidden p-6 md:p-7 bg-background">{children}</main>
      </div>
    </ShellWrapper>
  );
}
