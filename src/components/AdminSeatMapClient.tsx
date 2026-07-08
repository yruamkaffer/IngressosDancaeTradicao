"use client";

import { Armchair, Lock, TicketCheck, Timer, WalletCards } from "lucide-react";
import { eventConfig } from "@/config/event";
import { seatStatusLabel } from "@/lib/format";
import type { Seat } from "@/types/domain";

const statusCards = [
  { status: "available", icon: TicketCheck, tone: "bg-teal/12 text-teal" },
  { status: "reserved", icon: Timer, tone: "bg-brass/25 text-ink" },
  { status: "sold", icon: WalletCards, tone: "bg-stage/18 text-stage" },
  { status: "blocked", icon: Lock, tone: "bg-ink/12 text-ink" }
] as const;

export function AdminSeatMapClient({ seats }: { seats: Seat[] }) {
  const counts = statusCards.map((card) => ({
    ...card,
    count: seats.filter((seat) => seat.status === card.status).length
  }));

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-curtain text-white">
            <Armchair className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink">Controle de capacidade</h1>
            <p className="mt-1 text-sm leading-6 text-ink/65">
              Nao existe mapa de cadeiras na venda. O sistema usa {eventConfig.totalCapacity} lugares apenas para
              controle interno de capacidade, e os assentos do teatro serao distribuidos por ordem de chegada.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(({ status, count, icon: Icon, tone }) => (
          <div key={status} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold uppercase text-ink/55">{seatStatusLabel(status)}</div>
                <div className="mt-2 text-3xl font-black text-ink">{count}</div>
              </div>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
