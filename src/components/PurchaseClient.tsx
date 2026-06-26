"use client";

import { ArrowRight, Loader2, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { eventConfig } from "@/config/event";
import { formatCurrency } from "@/lib/format";
import { validateBuyer } from "@/lib/validation";
import type { Seat } from "@/types/domain";
import { SeatLegend } from "./SeatLegend";
import { SeatMap } from "./SeatMap";

type ApiResponse =
  | { ok: true; data: { reservationCode: string; seatCount: number } }
  | { ok: false; error: string; details?: Record<string, string> };

export function PurchaseClient({ initialSeats }: { initialSeats: Seat[] }) {
  const router = useRouter();
  const [seats, setSeats] = useState(initialSeats);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCpf, setBuyerCpf] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const availableCount = useMemo(
    () => seats.filter((seat) => seat.status === "available").length,
    [seats]
  );

  const selectedSeatIds = useMemo(() => selectedSeats.map((seat) => seat.id), [selectedSeats]);
  const selectedSeatLabels = selectedSeats.map((seat) => seat.label).join(", ");
  const totalPrice = selectedSeats.length * eventConfig.ticketPrice;

  async function refreshSeats() {
    const response = await fetch("/api/seats", { cache: "no-store" });
    const payload = await response.json();
    if (payload.ok) {
      const freshSeats = payload.data.seats as Seat[];
      setSeats(freshSeats);
      setSelectedSeats((current) =>
        current
          .map((selected) => freshSeats.find((seat) => seat.id === selected.id))
          .filter((seat): seat is Seat => Boolean(seat && seat.status === "available"))
      );
    }
  }

  function handleSeatSelect(seat: Seat) {
    setMessage("");
    setErrors((current) => ({ ...current, seatIds: "", seatId: "" }));

    setSelectedSeats((current) => {
      if (current.some((selected) => selected.id === seat.id)) {
        return current.filter((selected) => selected.id !== seat.id);
      }

      if (current.length >= eventConfig.maxSeatsPerOrder) {
        setMessage(`Voce pode selecionar no maximo ${eventConfig.maxSeatsPerOrder} assentos por compra.`);
        return current;
      }

      return [...current, seat].sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const parsed = validateBuyer({
      buyerName,
      buyerPhone,
      buyerCpf,
      buyerEmail,
      seatIds: selectedSeatIds
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
        seatIds: parsed.data.seatIds,
        buyerName: parsed.data.buyerName,
        buyerPhone: parsed.data.buyerPhone,
        buyerCpf: parsed.data.buyerCpf,
        buyerEmail: parsed.data.buyerEmail
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
              <p className="text-sm text-ink/65">
                {formatCurrency(eventConfig.ticketPrice)} por assento, ate {eventConfig.maxSeatsPerOrder} por compra
              </p>
            </div>
          </div>
          <div className="rounded-md border border-line bg-mist px-4 py-3 text-sm text-ink/75 lg:max-w-md lg:text-right">
            <div className="font-bold text-ink">Assentos escolhidos</div>
            {selectedSeats.length > 0 ? (
              <>
                <div>{selectedSeatLabels}</div>
                <div className="mt-1 font-black text-curtain">Total: {formatCurrency(totalPrice)}</div>
              </>
            ) : (
              <div>Selecione de 1 a {eventConfig.maxSeatsPerOrder} assentos no mapa abaixo.</div>
            )}
            {(errors.seatIds || errors.seatId) && (
              <span className="mt-1 block text-sm text-rose">{errors.seatIds ?? errors.seatId}</span>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className="block lg:col-span-2">
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

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-sm font-bold text-ink">Email para receber o ticket</span>
            <input
              className="input"
              value={buyerEmail}
              onChange={(event) => setBuyerEmail(event.target.value)}
              inputMode="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
            />
            {errors.buyerEmail && <span className="mt-1 block text-sm text-rose">{errors.buyerEmail}</span>}
          </label>

          <div className="flex items-end lg:col-span-2">
            <div className="w-full rounded-lg border border-line bg-white/70 p-3 text-sm leading-6 text-ink/65">
              <div className="mb-1 flex items-center gap-2 font-bold text-ink">
                <Mail className="h-4 w-4 text-stage" />
                Envio do ticket
              </div>
              O PDF sera enviado para este email apos validacao manual do pagamento.
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-stretch">
          {message ? (
            <div className="rounded-lg border border-rose/25 bg-rose/10 p-3 text-sm text-rose">
              {message}
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-white/70 p-3 text-sm text-ink/65">
              {eventConfig.pixInstructions}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary min-h-[52px] w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Reservar {selectedSeats.length > 1 ? "assentos" : "assento"}
          </button>
        </div>
      </form>

      <section className="card min-w-0 overflow-hidden p-4 lg:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Mapa do teatro</h2>
            <p className="text-sm text-ink/65">
              {availableCount} assentos disponiveis. Selecione ate {eventConfig.maxSeatsPerOrder} lugares.
            </p>
          </div>
          <SeatLegend />
        </div>

        <SeatMap
          seats={seats}
          selectedSeatIds={selectedSeatIds}
          onSelect={handleSeatSelect}
        />
      </section>
    </div>
  );
}