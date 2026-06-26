"use client";

import { ArrowRight, Loader2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { eventConfig } from "@/config/event";
import { formatCurrency } from "@/lib/format";
import { validateBuyer } from "@/lib/validation";
import type { Seat } from "@/types/domain";
import { SeatLegend } from "./SeatLegend";
import { SeatMap } from "./SeatMap";

type ApiResponse =
  | { ok: true; data: { reservationCode: string } }
  | { ok: false; error: string; details?: Record<string, string> };

export function PurchaseClient({ initialSeats }: { initialSeats: Seat[] }) {
  const router = useRouter();
  const [seats, setSeats] = useState(initialSeats);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const availableCount = useMemo(
    () => seats.filter((seat) => seat.status === "available").length,
    [seats]
  );

  async function refreshSeats() {
    const response = await fetch("/api/seats", { cache: "no-store" });
    const payload = await response.json();
    if (payload.ok) {
      setSeats(payload.data.seats);
      const freshSelected = payload.data.seats.find((seat: Seat) => seat.id === selectedSeat?.id);
      if (freshSelected?.status !== "available") {
        setSelectedSeat(null);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const parsed = validateBuyer({
      buyerName,
      buyerPhone,
      buyerCpf,
      seatId: selectedSeat?.id
    });

    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: eventConfig.id,
        seatId: parsed.data.seatId,
        buyerName: parsed.data.buyerName,
        buyerPhone: parsed.data.buyerPhone,
        buyerCpf: parsed.data.buyerCpf
      })
    });

    const payload = (await response.json()) as ApiResponse;
    setLoading(false);

    if (!payload.ok) {
      setMessage(payload.error);
      await refreshSeats();
      return;
    }

    router.push(`/pagamento/${payload.data.reservationCode}`);
  }

  return (
    <div className="grid min-w-0 gap-6">
      <form onSubmit={handleSubmit} className="card min-w-0 p-5 lg:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-curtain text-white">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-ink">Comprar ingresso</h1>
              <p className="text-sm text-ink/65">{formatCurrency(eventConfig.ticketPrice)} por assento</p>
            </div>
          </div>
          <div className="rounded-md border border-line bg-mist px-4 py-3 text-sm text-ink/75 lg:text-right">
            <div className="font-bold text-ink">Assento escolhido</div>
            {selectedSeat ? <div>{selectedSeat.label}</div> : <div>Selecione no mapa abaixo.</div>}
            {errors.seatId && <span className="mt-1 block text-sm text-rose">{errors.seatId}</span>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-ink">Nome completo</span>
            <input
              className="input"
              value={buyerName}
              onChange={(event) => setBuyerName(event.target.value)}
              autoComplete="name"
            />
            {errors.buyerName && <span className="mt-1 block text-sm text-rose">{errors.buyerName}</span>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-ink">Telefone</span>
            <input
              className="input"
              value={buyerPhone}
              onChange={(event) => setBuyerPhone(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="DDD + numero"
            />
            {errors.buyerPhone && (
              <span className="mt-1 block text-sm text-rose">{errors.buyerPhone}</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-ink">CPF</span>
            <input
              className="input"
              value={buyerCpf}
              onChange={(event) => setBuyerCpf(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Somente numeros"
            />
            {errors.buyerCpf && <span className="mt-1 block text-sm text-rose">{errors.buyerCpf}</span>}
          </label>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-stretch">
          {message ? (
            <div className="rounded-lg border border-rose/25 bg-rose/10 p-3 text-sm text-rose">
              {message}
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-white/70 p-3 text-sm text-ink/65">
              Reservas ficam pendentes ate validacao manual.
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary min-h-[52px] w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Reservar assento
          </button>
        </div>
      </form>

      <section className="card min-w-0 overflow-hidden p-4 lg:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Mapa do teatro</h2>
            <p className="text-sm text-ink/65">
              {availableCount} assentos disponiveis. Reservas ficam pendentes ate validacao manual.
            </p>
          </div>
          <SeatLegend />
        </div>

        <SeatMap
          seats={seats}
          selectedSeatId={selectedSeat?.id}
          onSelect={(seat) => setSelectedSeat(seat)}
        />
      </section>
    </div>
  );
}