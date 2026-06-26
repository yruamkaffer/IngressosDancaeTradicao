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

type SeatSection = {
  type: "seats";
  sector: string;
  title: string;
  columns: number;
  rows: string[];
};

type AisleSection = {
  type: "aisle";
  title: string;
};

type TheaterSection = SeatSection | AisleSection;

const mainRows = Array.from("ABCDEFGHIJKLMNOP");
const balconyRows = Array.from("ABCDEFGH");

const officialSectors = new Set(["Plateia esquerda", "Plateia central", "Plateia direita", "2º piso"]);

const mainFloor: TheaterSection[] = [
  { type: "seats", sector: "Plateia esquerda", title: "Plateia esquerda", columns: 6, rows: mainRows },
  { type: "aisle", title: "Corredor" },
  { type: "seats", sector: "Plateia central", title: "Plateia central", columns: 20, rows: mainRows },
  { type: "aisle", title: "Corredor" },
  { type: "seats", sector: "Plateia direita", title: "Plateia direita", columns: 6, rows: mainRows }
];

const balcony: SeatSection = {
  type: "seats",
  sector: "2º piso",
  title: "2º piso",
  columns: 16,
  rows: balconyRows
};

const statusClasses: Record<SeatStatus, string> = {
  available:
    "border-teal bg-teal/10 text-teal hover:bg-teal hover:text-white hover:shadow-md",
  reserved: "cursor-not-allowed border-brass bg-brass/25 text-ink/55",
  sold: "cursor-not-allowed border-curtain bg-curtain text-white",
  blocked: "cursor-not-allowed border-ink bg-ink/15 text-ink/45"
};

function sectorRowKey(sector: string, row: string) {
  return `${sector}::${row}`;
}

function formatSeatNumber(number: number) {
  return number.toString().padStart(2, "0");
}

function sectionWidth(columns: number) {
  return `${columns * 1.7 + Math.max(columns - 1, 0) * 0.25 + 2.6}rem`;
}

function rowSort(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", { numeric: true });
}

export function SeatMap({
  seats,
  selectedSeatId,
  onSelect,
  adminMode = false,
  busySeatId,
  onBlock,
  onUnblock
}: SeatMapProps) {
  const seatsBySectorRow = useMemo(() => {
    const grouped = new Map<string, Seat[]>();

    for (const seat of seats) {
      const key = sectorRowKey(seat.sector, seat.row);
      const list = grouped.get(key) ?? [];
      list.push(seat);
      grouped.set(key, list);
    }

    for (const rowSeats of grouped.values()) {
      rowSeats.sort((left, right) => left.number - right.number);
    }

    return grouped;
  }, [seats]);

  const legacySections = useMemo<SeatSection[]>(() => {
    const bySector = new Map<string, Map<string, Seat[]>>();

    for (const seat of seats) {
      if (officialSectors.has(seat.sector)) {
        continue;
      }

      const sectorRows = bySector.get(seat.sector) ?? new Map<string, Seat[]>();
      const rowSeats = sectorRows.get(seat.row) ?? [];
      rowSeats.push(seat);
      sectorRows.set(seat.row, rowSeats);
      bySector.set(seat.sector, sectorRows);
    }

    return Array.from(bySector.entries())
      .sort(([left], [right]) => left.localeCompare(right, "pt-BR"))
      .map(([sector, rows]) => {
        const sortedRows = Array.from(rows.keys()).sort(rowSort);
        const columns = Math.max(
          1,
          ...Array.from(rows.values()).map((rowSeats) => rowSeats.length)
        );

        return {
          type: "seats",
          sector,
          title: sector,
          columns,
          rows: sortedRows
        };
      });
  }, [seats]);

  const hasOfficialSeats = seats.some((seat) => officialSectors.has(seat.sector));
  const mainSeatSections = mainFloor.filter((section): section is SeatSection => section.type === "seats");

  function renderSeatButton(seat: Seat | undefined, fallbackNumber: number, emptyKey: string) {
    if (!seat) {
      return <div key={emptyKey} className="h-7 w-7" aria-hidden />;
    }

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
          title={seat.label}
          disabled={!adminMode && disabled}
          onClick={() => {
            if (adminMode) {
              return;
            }
            if (!disabled) {
              onSelect?.(seat);
            }
          }}
          className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-black leading-none transition ${className} ${
            !adminMode && disabled ? "opacity-75" : ""
          }`}
        >
          {isBusy ? "..." : formatSeatNumber(seat.number)}
        </button>

        {adminMode && (
          <div className="h-6">
            {seat.status === "available" && (
              <button
                type="button"
                onClick={() => onBlock?.(seat)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-line bg-white text-ink hover:border-curtain hover:text-curtain"
                title={`Bloquear ${seat.label}`}
                aria-label={`Bloquear assento ${seat.label}`}
              >
                <Lock className="h-3 w-3" />
              </button>
            )}
            {seat.status === "blocked" && (
              <button
                type="button"
                onClick={() => onUnblock?.(seat)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-line bg-white text-teal hover:border-teal"
                title={`Desbloquear ${seat.label}`}
                aria-label={`Desbloquear assento ${seat.label}`}
              >
                <Unlock className="h-3 w-3" />
              </button>
            )}
            {seat.status === "reserved" && (
              <Armchair className="mx-auto h-4 w-4 text-brass" aria-hidden />
            )}
            {seat.status === "sold" && (
              <Armchair className="mx-auto h-4 w-4 text-curtain" aria-hidden />
            )}
          </div>
        )}
      </div>
    );
  }

  function renderSeatSection(section: SeatSection) {
    return (
      <div
        key={section.sector}
        className="mx-auto rounded-lg border border-line bg-white/90 p-3 shadow-sm"
        style={{ width: sectionWidth(section.columns) }}
      >
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-2">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-curtain">
            {section.title}
          </div>
          <div className="text-[11px] font-bold text-ink/50">
            {section.rows.length * section.columns} lugares
          </div>
        </div>
        <div className="space-y-1.5">
          {section.rows.map((row) => {
            const rowSeats = seatsBySectorRow.get(sectorRowKey(section.sector, row)) ?? [];
            return (
              <div key={`${section.sector}-${row}`} className="grid grid-cols-[1.6rem_1fr] items-center gap-2">
                <div className="text-center text-[11px] font-black text-curtain">{row}</div>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${section.columns}, minmax(1.7rem, 1.7rem))` }}
                >
                  {Array.from({ length: section.columns }, (_, index) =>
                    renderSeatButton(rowSeats[index], index + 1, `${section.sector}-${row}-${index}`)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderStackedSection(section: SeatSection) {
    return (
      <div key={section.sector} className="w-full overflow-x-auto pb-1">
        <div className="min-w-max px-1">
          {renderSeatSection(section)}
        </div>
      </div>
    );
  }

  function renderAisle(index: number) {
    return (
      <div
        key={`aisle-${index}`}
        className="mx-auto flex h-9 w-full max-w-3xl items-center justify-center rounded-md border border-dashed border-line bg-mist/70 text-[10px] font-black uppercase tracking-[0.16em] text-ink/50"
      >
        Corredor
      </div>
    );
  }

  if (!hasOfficialSeats && legacySections.length > 0) {
    return (
      <div className="w-full overflow-hidden rounded-lg border border-line bg-white/70 p-4">
        <div className="mb-5 rounded-md border border-curtain/20 bg-gradient-to-r from-curtain via-rose to-stage px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-white">
          PALCO
        </div>
        <div className="space-y-4">
          {legacySections.map((section) => renderStackedSection(section))}
        </div>
        <div className="mt-4 text-center text-xs font-bold text-ink/55">
          Mapa temporario com {seats.length} assentos carregados.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-line bg-white/70 p-3 sm:p-4 lg:p-5">
      <div className="mb-5 rounded-md border border-curtain/20 bg-gradient-to-r from-curtain via-rose to-stage px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-white">
        PALCO
      </div>

      <div className="space-y-4">
        {mainSeatSections.map((section, index) => (
          <div key={section.sector} className="space-y-4">
            {index > 0 && renderAisle(index)}
            {renderStackedSection(section)}
          </div>
        ))}

        <div className="rounded-lg border-2 border-rose/55 bg-white/85 p-3 sm:p-4">
          {renderStackedSection(balcony)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs font-bold text-ink/55">
        <span>Plateia esquerda: 96 lugares</span>
        <span>Plateia central: 320 lugares</span>
        <span>Plateia direita: 96 lugares</span>
        <span>2º piso: 128 lugares</span>
        <span>Total: {seats.length || 640} lugares</span>
      </div>
    </div>
  );
}