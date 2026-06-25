import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { hasAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (!hasAdminSession()) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="container-page py-6">{children}</main>
    </div>
  );
}
