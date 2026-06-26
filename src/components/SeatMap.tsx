"use client";

import { Armchair, Lock, Unlock } from "lucide-react";
import { useMemo } from "react";
import type { Seat, SeatStatus } from "@/types/domain";

type SeatMapProps = {
  seats: Seat[];
  selectedSeatId?: string;
  selectedSeatIds?: string[];
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
const balconySector = "2\u00ba piso";

const officialSectors = new Set(["Plateia esquerda", "Plateia central", "Plateia direita", balconySector]);

const mainFloor: TheaterSection[] = [
  { type: "seats", sector: "Plateia esquerda", title: "Esquerda", columns: 6, rows: mainRows },
  { type: "aisle", title: "Corredor" },
  { type: "seats", sector: "Plateia central", title: "Centro", columns: 20, rows: mainRows },
  { type: "aisle", title: "Corredor" },
  { type: "seats", sector: "Plateia direita", title: "Direita", columns: 6, rows: mainRows }
];

const balcony: SeatSection = {
  type: "seats",
  sector: balconySector,
  title: balconySector,
  columns: 16,
  rows: balconyRows
};

const statusClasses: Record<SeatStatus, string> = {
  available:
    "border-stage bg-white text-stage hover:bg-stage hover:text-white hover:shadow-md",
  reserved: "cursor-not-allowed border-[#8b5cf6] bg-[#ede9fe] text-[#5b21b6]",
  sold: "cursor-not-allowed border-[#4c1d95] bg-[#4c1d95] text-white shadow-inner",
  blocked: "cursor-not-allowed border-[#17142a] bg-[#17142a] text-white opacity-90"
};

function normalizeSectorName(sector: string) {
  return sector.trim().replace("2\u00c2\u00ba", "2\u00ba");
}

function normalizeSeatStatus(status: string): SeatStatus {
  return status === "reserved" || status === "sold" || status === "blocked" ? status : "available";
}

function sectorRowKey(sector: string, row: string) {
  return `${normalizeSectorName(sector)}::${row}`;
}

function formatSeatNumber(number: number) {
  return number.toString().padStart(2, "0");
}

function sectionWidth(columns: number) {
  return `${columns * 1.5 + Math.max(columns - 1, 0) * 0.2 + 3.8}rem`;
}

function rowSort(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", { numeric: true });
}

export function SeatMap({
  seats,
  selectedSeatId,
  selectedSeatIds,
  onSelect,
  adminMode = false,
  busySeatId,
  onBlock,
  onUnblock
}: SeatMapProps) {
  const selectedIds = useMemo(
    () => new Set(selectedSeatIds ?? (selectedSeatId ? [selectedSeatId] : [])),
    [selectedSeatId, selectedSeatIds]
  );

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
      if (officialSectors.has(normalizeSectorName(seat.sector))) {
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

  const hasOfficialSeats = seats.some((seat) => officialSectors.has(normalizeSectorName(seat.sector)));

  function renderSeatButton(seat: Seat | undefined, emptyKey: string) {
    if (!seat) {
      return <div key={emptyKey} className="h-6 w-6" aria-hidden />;
    }

    const seatStatus = normalizeSeatStatus(seat.status);
    const selected = seatStatus === "available" && selectedIds.has(seat.id);
    const disabled = seatStatus !== "available";
    const isBusy = busySeatId === seat.id;
    const className = selected
      ? "border-stage bg-stage text-white shadow-md ring-2 ring-stage/25"
      : statusClasses[seatStatus];

    return (
      <div key={seat.id} className="flex flex-col items-center gap-1">
        <button
          type="button"
          aria-label={`Assento ${seat.label}, ${seatStatus}`}
          title={`${seat.label} - ${seatStatus}`}
          disabled={!adminMode && disabled}
          onClick={() => {
            if (adminMode) {
              return;
            }
            if (!disabled) {
              onSelect?.(seat);
            }
          }}
          data-status={seatStatus}
          className={`flex h-6 w-6 items-center justify-center rounded-md border text-[9px] font-black leading-none transition ${className} ${
            !adminMode && disabled ? "opacity-90" : ""
          }`}
        >
          {isBusy ? "..." : formatSeatNumber(seat.number)}
        </button>

        {adminMode && (
          <div className="h-6">
            {seatStatus === "available" && (
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
            {seatStatus === "blocked" && (
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
            {seatStatus === "reserved" && (
              <Armchair className="mx-auto h-4 w-4 text-[#8b5cf6]" aria-hidden />
            )}
            {seatStatus === "sold" && (
              <Armchair className="mx-auto h-4 w-4 text-[#4c1d95]" aria-hidden />
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
        className="shrink-0 rounded-lg border border-line bg-white/90 p-3 shadow-sm"
        style={{ width: sectionWidth(section.columns) }}
      >
        <div className="mb-3 text-center text-xs font-black uppercase tracking-[0.14em] text-curtain">
          {section.title}
        </div>
        <div className="space-y-1.5">
          {section.rows.map((row) => {
            const rowSeats = seatsBySectorRow.get(sectorRowKey(section.sector, row)) ?? [];
            return (
              <div key={`${section.sector}-${row}`} className="grid grid-cols-[1.35rem_1fr] items-center gap-2">
                <div className="text-center text-[11px] font-black text-curtain">{row}</div>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${section.columns}, minmax(1.5rem, 1.5rem))` }}
                >
                  {Array.from({ length: section.columns }, (_, index) =>
                    renderSeatButton(rowSeats[index], `${section.sector}-${row}-${index}`)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!hasOfficialSeats && legacySections.length > 0) {
    return (
      <div className="w-full max-w-full overflow-x-auto rounded-lg border border-line bg-white/70 p-4">
        <div className="inline-block min-w-full align-top">
          <div className="mx-auto mb-5 rounded-md border border-curtain/20 bg-gradient-to-r from-curtain via-rose to-stage px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-white">
            PALCO
          </div>
          <div className="flex w-max max-w-none gap-4">
            {legacySections.map((section) => renderSeatSection(section))}
          </div>
          <div className="mt-4 text-center text-xs font-bold text-ink/55">
            Mapa temporario com {seats.length} assentos carregados.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-auto rounded-lg border border-line bg-white/70 p-3 sm:p-4 lg:p-5">
      <div className="mx-auto w-max min-w-[1080px] max-w-none align-top">
        <div className="mx-auto mb-5 max-w-5xl rounded-md border border-curtain/20 bg-gradient-to-r from-curtain via-rose to-stage px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.18em] text-white">
          PALCO
        </div>

        <div className="flex items-stretch justify-center gap-3">
          {mainFloor.map((section, index) =>
            section.type === "aisle" ? (
              <div
                key={`${section.title}-${index}`}
                className="flex w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-line bg-mist/70 text-[9px] font-black uppercase tracking-[0.16em] text-ink/50 [writing-mode:vertical-rl]"
              >
                {section.title}
              </div>
            ) : (
              renderSeatSection(section)
            )
          )}
        </div>

        <div className="mt-6 rounded-lg border-2 border-rose/55 bg-white/85 p-4">
          <div className="mb-3 text-center text-sm font-black uppercase tracking-[0.16em] text-rose">
            {balconySector}
          </div>
          <div className="flex justify-center">{renderSeatSection(balcony)}</div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs font-bold text-ink/55">
          <span>Plateia esquerda: 96 lugares</span>
          <span>Plateia central: 320 lugares</span>
          <span>Plateia direita: 96 lugares</span>
          <span>{balconySector}: 128 lugares</span>
          <span>Total: {seats.length || 640} lugares</span>
        </div>
      </div>
    </div>
  );
}