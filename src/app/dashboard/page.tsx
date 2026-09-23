import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import UserDashboardClient from "./UserDashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Super Admin tidak punya user dashboard — langsung ke admin panel
  if (user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="app-shell min-h-screen flex flex-col text-slate-100">
      <Navbar user={user} />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <UserDashboardClient initialUser={user} />
      </main>
    </div>
  );
}
