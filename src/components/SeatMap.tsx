"use client";

import { Armchair, Lock, Unlock } from "lucide-react";
import { useMemo } from "react";
import type { Seat, SeatStatus } from "@/types/domain";

type SeatMapProps = {
  seats: Seat[];
  selectedSeatId?: string;
  onSelect?: (seat: Seat) => void;
  adminMode?: boolean;
  busySeatId?: string | null;
  onBlock?: (seat: Seat) => void;
  onUnblock?: (seat: Seat) => void;
};

const statusClasses: Record<SeatStatus, string> = {
  available:
    "border-teal bg-teal/10 text-teal hover:bg-teal hover:text-white hover:shadow-md",
  reserved: "cursor-not-allowed border-brass bg-brass/25 text-ink/55",
  sold: "cursor-not-allowed border-curtain bg-curtain text-white",
  blocked: "cursor-not-allowed border-ink bg-ink/15 text-ink/45"
};

export function SeatMap({
  seats,
  selectedSeatId,
  onSelect,
  adminMode = false,
  busySeatId,
  onBlock,
  onUnblock
}: SeatMapProps) {
  const rows = useMemo(() => {
    const grouped = new Map<string, Seat[]>();
    for (const seat of seats) {
      const list = grouped.get(seat.row) ?? [];
      list.push(seat);
      grouped.set(seat.row, list);
    }

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([row, rowSeats]) => ({
        row,
        seats: rowSeats.sort((left, right) => left.number - right.number)
      }));
  }, [seats]);

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-line bg-white/70 p-4">
      <div className="mx-auto min-w-[620px] max-w-3xl">
        <div className="mb-6 rounded-md border border-curtain/20 bg-gradient-to-r from-curtain via-rose to-stage px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-white">
          PALCO
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.row} className="grid grid-cols-[42px_1fr] items-center gap-3">
              <div className="text-center text-sm font-bold text-curtain">{row.row}</div>
              <div className="grid grid-cols-10 gap-2">
                {row.seats.map((seat) => {
                  const selected = seat.id === selectedSeatId;
                  const disabled = seat.status !== "available";
                  const isBusy = busySeatId === seat.id;
                  const className = selected
                    ? "border-stage bg-stage text-white shadow-md"
                    : statusClasses[seat.status];

                  return (
                    <div key={seat.id} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Assento ${seat.label}, ${seat.status}`}
                        disabled={!adminMode && disabled}
                        onClick={() => {
                          if (adminMode) {
                            return;
                          }
                          if (!disabled) {
                            onSelect?.(seat);
                          }
                        }}
                        className={`flex h-11 w-12 items-center justify-center rounded-md border text-xs font-bold transition ${className} ${
                          !adminMode && disabled ? "opacity-75" : ""
                        }`}
                      >
                        {isBusy ? "..." : seat.label}
                      </button>

                      {adminMode && (
                        <div className="h-7">
                          {seat.status === "available" && (
                            <button
                              type="button"
                              onClick={() => onBlock?.(seat)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-ink hover:border-curtain hover:text-curtain"
                              title={`Bloquear ${seat.label}`}
                              aria-label={`Bloquear assento ${seat.label}`}
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {seat.status === "blocked" && (
                            <button
                              type="button"
                              onClick={() => onUnblock?.(seat)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-teal hover:border-teal"
                              title={`Desbloquear ${seat.label}`}
                              aria-label={`Desbloquear assento ${seat.label}`}
                            >
                              <Unlock className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {seat.status === "reserved" && (
                            <Armchair className="mx-auto h-5 w-5 text-brass" aria-hidden />
                          )}
                          {seat.status === "sold" && (
                            <Armchair className="mx-auto h-5 w-5 text-curtain" aria-hidden />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
