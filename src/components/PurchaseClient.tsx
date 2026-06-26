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
    <div className="grid min-w-0 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <form onSubmit={handleSubmit} className="card h-fit min-w-0 p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-curtain text-white">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink">Comprar ingresso</h1>
            <p className="text-sm text-ink/65">{formatCurrency(eventConfig.ticketPrice)} por assento</p>
          </div>
        </div>

        <div className="space-y-4">
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
              placeholder="DDD + número"
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
              placeholder="Somente números"
            />
            {errors.buyerCpf && <span className="mt-1 block text-sm text-rose">{errors.buyerCpf}</span>}
          </label>

          <div className="rounded-lg border border-line bg-mist p-3 text-sm text-ink/75">
            <div className="font-bold text-ink">Assento escolhido</div>
            {selectedSeat ? (
              <div>{selectedSeat.label}</div>
            ) : (
              <div>Selecione um assento disponível no mapa.</div>
            )}
            {errors.seatId && <span className="mt-1 block text-sm text-rose">{errors.seatId}</span>}
          </div>

          {message && (
            <div className="rounded-lg border border-rose/25 bg-rose/10 p-3 text-sm text-rose">
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Reservar assento
          </button>
        </div>
      </form>

      <section className="card min-w-0 overflow-hidden p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Mapa do teatro</h2>
            <p className="text-sm text-ink/65">
              {availableCount} assentos disponíveis. Reservas ficam pendentes até validação manual.
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
