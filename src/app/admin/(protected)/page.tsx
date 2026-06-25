import { Armchair, Banknote, Lock, TicketCheck, Timer, WalletCards } from "lucide-react";
import Link from "next/link";
import { ReservationActions } from "@/components/ReservationActions";
import { StatusBadge } from "@/components/StatusBadge";
import { eventConfig } from "@/config/event";
import { formatCurrency, formatPhone, maskCpf } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { AdminOrder, Seat } from "@/types/domain";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = getSupabaseAdmin();
  const [{ data: seats, error: seatsError }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from("seats").select("*").eq("event_id", eventConfig.id),
    supabase
      .from("orders")
      .select("*,seats(label),tickets(ticket_code)")
      .eq("event_id", eventConfig.id)
      .order("created_at", { ascending: false })
  ]);

  if (seatsError) {
    throw new Error(seatsError.message);
  }
  if (ordersError) {
    throw new Error(ordersError.message);
  }

  return {
    seats: (seats ?? []) as Seat[],
    orders: (orders ?? []) as AdminOrder[]
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone
}: {
  label: string;
  value: string | number;
  icon: typeof Armchair;
  tone: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold uppercase text-ink/55">{label}</div>
          <div className="mt-2 text-3xl font-black text-ink">{value}</div>
        </div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { seats, orders } = await getDashboardData();
  const paidOrders = orders.filter((order) => order.status === "paid");
  const pendingOrders = orders.filter((order) => order.status === "pending_payment");

  const stats = {
    total: seats.length,
    available: seats.filter((seat) => seat.status === "available").length,
    pending: pendingOrders.length,
    sold: seats.filter((seat) => seat.status === "sold").length,
    blocked: seats.filter((seat) => seat.status === "blocked").length,
    revenue: paidOrders.length * eventConfig.ticketPrice
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-ink">Dashboard</h1>
          <p className="mt-1 text-ink/65">{eventConfig.name}</p>
        </div>
        <Link href="/admin/reservas" className="btn btn-primary">
          <TicketCheck className="h-4 w-4" />
          Ver reservas
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total de assentos" value={stats.total} icon={Armchair} tone="bg-curtain text-white" />
        <StatCard label="Disponiveis" value={stats.available} icon={TicketCheck} tone="bg-teal/12 text-teal" />
        <StatCard label="Reservas pendentes" value={stats.pending} icon={Timer} tone="bg-brass/25 text-ink" />
        <StatCard label="Ingressos vendidos" value={stats.sold} icon={WalletCards} tone="bg-stage/18 text-stage" />
        <StatCard label="Bloqueados" value={stats.blocked} icon={Lock} tone="bg-ink/12 text-ink" />
        <StatCard label="Faturamento" value={formatCurrency(stats.revenue)} icon={Banknote} tone="bg-rose/12 text-rose" />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card overflow-hidden p-0">
          <div className="border-b border-line p-5">
            <h2 className="text-xl font-bold text-ink">Reservas pendentes</h2>
            <p className="text-sm text-ink/65">Confirme manualmente apos receber o comprovante.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[720px] border-0">
              <thead>
                <tr>
                  <th>Reserva</th>
                  <th>Comprador</th>
                  <th>Assento</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.slice(0, 6).map((order) => (
                  <tr key={order.id}>
                    <td className="font-bold text-ink">{order.reservation_code}</td>
                    <td>
                      <div className="font-bold text-ink">{order.buyer_name}</div>
                      <div className="text-sm text-ink/65">{formatPhone(order.buyer_phone)}</div>
                      <div className="text-sm text-ink/65">{maskCpf(order.buyer_cpf)}</div>
                    </td>
                    <td className="font-bold text-ink">{order.seats?.label}</td>
                    <td>
                      <ReservationActions orderId={order.id} />
                    </td>
                  </tr>
                ))}
                {pendingOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-ink/60">
                      Nenhuma reserva pendente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="border-b border-line p-5">
            <h2 className="text-xl font-bold text-ink">Ingressos pagos</h2>
            <p className="text-sm text-ink/65">Tickets gerados apos confirmacao manual.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[620px] border-0">
              <thead>
                <tr>
                  <th>Comprador</th>
                  <th>Assento</th>
                  <th>Status</th>
                  <th>Ticket</th>
                </tr>
              </thead>
              <tbody>
                {paidOrders.slice(0, 6).map((order) => {
                  const ticket = Array.isArray(order.tickets) ? order.tickets[0] : null;
                  return (
                    <tr key={order.id}>
                      <td className="font-bold text-ink">{order.buyer_name}</td>
                      <td className="font-bold text-ink">{order.seats?.label}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>{ticket?.ticket_code ?? "-"}</td>
                    </tr>
                  );
                })}
                {paidOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-ink/60">
                      Nenhum ingresso vendido ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
