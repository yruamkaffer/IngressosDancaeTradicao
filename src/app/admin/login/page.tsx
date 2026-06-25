import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { hasAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  if (hasAdminSession()) {
    redirect("/admin");
  }

  return (
    <main className="container-page flex min-h-screen items-center py-8">
      <AdminLoginForm />
    </main>
  );
}
