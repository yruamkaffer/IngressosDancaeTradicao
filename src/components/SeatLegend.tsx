import { seatStatusLabel } from "@/lib/format";
import type { SeatStatus } from "@/types/domain";

const items: Array<{ status: SeatStatus | "selected"; className: string; label: string }> = [
  {
    status: "available",
    className: "border-stage bg-white",
    label: seatStatusLabel("available")
  },
  {
    status: "selected",
    className: "border-stage bg-stage text-white",
    label: "Selecionado"
  },
  {
    status: "reserved",
    className: "border-[#8b5cf6] bg-[#ede9fe]",
    label: seatStatusLabel("reserved")
  },
  {
    status: "sold",
    className: "border-[#4c1d95] bg-[#4c1d95]",
    label: seatStatusLabel("sold")
  },
  {
    status: "blocked",
    className: "border-[#17142a] bg-[#17142a]",
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
