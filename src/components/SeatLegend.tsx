import { seatStatusLabel } from "@/lib/format";
import type { SeatStatus } from "@/types/domain";

const items: Array<{ status: SeatStatus | "selected"; className: string; label: string }> = [
  {
    status: "available",
    className: "border-teal bg-teal/10",
    label: seatStatusLabel("available")
  },
  {
    status: "selected",
    className: "border-stage bg-stage text-white",
    label: "Selecionado"
  },
  {
    status: "reserved",
    className: "border-brass bg-brass/25",
    label: seatStatusLabel("reserved")
  },
  {
    status: "sold",
    className: "border-curtain bg-curtain text-white",
    label: seatStatusLabel("sold")
  },
  {
    status: "blocked",
    className: "border-ink bg-ink/15",
    label: seatStatusLabel("blocked")
  }
];

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-sm text-ink/75">
      {items.map((item) => (
        <span key={item.status} className="inline-flex items-center gap-2">
          <span className={`h-4 w-4 rounded border ${item.className}`} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}
