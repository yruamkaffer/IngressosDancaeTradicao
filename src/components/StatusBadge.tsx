import { orderStatusLabel, seatStatusLabel } from "@/lib/format";

type StatusBadgeProps = {
  status: string;
  type?: "order" | "seat";
};

const classes: Record<string, string> = {
  available: "bg-teal/10 text-teal border-teal/25",
  reserved: "bg-brass/20 text-ink border-brass/40",
  sold: "bg-curtain text-white border-curtain",
  blocked: "bg-ink/10 text-ink/65 border-ink/20",
  pending_payment: "bg-brass/20 text-ink border-brass/40",
  paid: "bg-teal/10 text-teal border-teal/25",
  cancelled: "bg-rose/10 text-rose border-rose/20"
};

export function StatusBadge({ status, type = "order" }: StatusBadgeProps) {
  const label = type === "seat" ? seatStatusLabel(status) : orderStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold ${
        classes[status] ?? "border-line bg-mist text-ink"
      }`}
    >
      {label}
    </span>
  );
}
