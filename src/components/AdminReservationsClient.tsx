"use client";

import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { ReservationActions } from "./ReservationActions";
import { StatusBadge } from "./StatusBadge";

export type AdminReservationRow = {
  id: string;
  reservationCode: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerCpfMasked: string;
  buyerCpfHash: string;
  seatLabel: string;
  seatCount: number;
  status: string;
  ticketCode: string | null;
  createdAt: string;
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function AdminReservationsClient({
  orders,
  ticketPrice
}: {
  orders: AdminReservationRow[];
  ticketPrice: number;
}) {
  const [query, setQuery] = useState("");
  const [cpfHash, setCpfHash] = useState("");

  useEffect(() => {
    const digits = query.replace(/\D/g, "");
    if (digits.length !== 11) {
      setCpfHash("");
      return;
    }

    let cancelled = false;
    sha256(digits).then((hash) => {
      if (!cancelled) {
        setCpfHash(hash);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const digits = query.replace(/\D/g, "");
    const hasDigits = digits.length > 0;
    if (!text) {
      return orders;
    }

    return orders.filter((order) => {
      const fields = [
        order.buyerName,
        order.buyerPhone,
        order.buyerEmail,
        order.reservationCode,
        order.seatLabel,
        order.ticketCode ?? ""
      ]
        .join(" ")
        .toLowerCase();

      return (
        fields.includes(text) ||
        (hasDigits && order.buyerPhone.replace(/\D/g, "").includes(digits)) ||
        order.buyerCpfHash === cpfHash
      );
    });
  }, [cpfHash, orders, query]);

  const pending = filtered.filter((order) => order.status === "pending_payment");
  const paid = filtered.filter((order) => order.status === "paid");

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-ink">Reservas e pedidos</h1>
            <p className="mt-1 text-sm text-ink/65">
              Busque por nome, CPF completo, telefone, email, codigo da reserva, ticket ou assento.
            </p>
          </div>
          <a href="/api/admin/export-csv" className="btn btn-secondary">
            <Download className="h-4 w-4" />
            Exportar pagos
          </a>
        </div>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-bold text-ink">Busca</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              className="input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, CPF, telefone, email, reserva ou assento"
            />
          </div>
        </label>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <div className="text-sm font-bold uppercase text-ink/55">Resultado</div>
          <div className="mt-1 text-2xl font-black text-ink">{filtered.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm font-bold uppercase text-ink/55">Pendentes</div>
          <div className="mt-1 text-2xl font-black text-stage">{pending.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm font-bold uppercase text-ink/55">Pagos</div>
          <div className="mt-1 text-2xl font-black text-teal">{paid.length}</div>
        </div>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1120px] border-0">
            <thead>
              <tr>
                <th>Reserva</th>
                <th>Comprador</th>
                <th>Assentos</th>
                <th>Status</th>
                <th>Tickets</th>
                <th>Valor</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.reservationCode}>
                  <td>
                    <div className="font-bold text-ink">{order.reservationCode}</div>
                    <div className="text-xs text-ink/55">{new Date(order.createdAt).toLocaleString("pt-BR")}</div>
                    <div className="text-xs text-ink/55">{order.seatCount} ingresso(s)</div>
                  </td>
                  <td>
                    <div className="font-bold text-ink">{order.buyerName}</div>
                    <div className="text-sm text-ink/65">{order.buyerPhone}</div>
                    <div className="text-sm text-ink/65">{order.buyerEmail || "Sem email"}</div>
                    <div className="text-sm text-ink/65">{order.buyerCpfMasked}</div>
                  </td>
                  <td className="max-w-[260px] font-bold text-ink">{order.seatLabel}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="max-w-[220px] text-sm">{order.ticketCode ?? "-"}</td>
                  <td>{order.status === "paid" ? formatCurrency(ticketPrice * order.seatCount) : "-"}</td>
                  <td>
                    {order.status === "pending_payment" ? (
                      <ReservationActions orderId={order.id} showDelete />
                    ) : order.status === "paid" ? (
                      <div className="flex flex-wrap gap-2">
                        <a href={`/api/tickets/${order.id}/pdf?by=order`} className="btn btn-secondary min-h-10 px-3 py-2 text-sm">
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                        <ReservationActions orderId={order.id} showConfirm={false} showCancel={false} showDelete />
                      </div>
                    ) : (
                      <ReservationActions orderId={order.id} showConfirm={false} showCancel={false} showDelete />
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-ink/60">
                    Nenhuma reserva encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}