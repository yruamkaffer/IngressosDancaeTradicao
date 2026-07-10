"use client";

import { Armchair, BarChart3, LogOut, SearchCheck, TicketCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/reservas", label: "Reservas", icon: TicketCheck },
  { href: "/admin/assentos", label: "Capacidade", icon: Armchair },
  { href: "/admin/validar", label: "Validar", icon: SearchCheck }
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-white/85">
      <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/admin" className="text-lg font-black text-curtain">
          Admin Ingressos
        </Link>
        <nav className="flex flex-wrap gap-2" aria-label="Navegação administrativa">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`btn min-h-10 px-3 py-2 text-sm ${
                  active ? "bg-curtain text-white" : "border border-line bg-white text-ink"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <button type="button" onClick={logout} className="btn min-h-10 border border-line bg-white px-3 py-2 text-sm">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
