import { eventConfig } from "@/config/event";
import { requestHasAdminSession } from "@/lib/admin-auth";
import { fail } from "@/lib/api";
import { formatPhone, maskCpf } from "@/lib/format";
import { relationLabel, relationTicketCode } from "@/lib/supabase/relations";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  if (!requestHasAdminSession(request)) {
    return fail("Nao autorizado.", 401);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,buyer_name,buyer_phone,buyer_cpf,buyer_email,ticket_type,ticket_price,reservation_code,status,created_at,seats(label),tickets(ticket_code,used_at)"
    )
    .eq("event_id", eventConfig.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) {
    return fail("Nao foi possivel exportar os pedidos.", 500, error.message);
  }

  const header = [
    "reserva",
    "ticket",
    "nome",
    "telefone",
    "email",
    "cpf_mascarado",
    "tipo_ingresso",
    "controle_interno",
    "valor",
    "criado_em"
  ];

  const rows = (data ?? []).map((order) => {
    const ticketType = order.ticket_type === "half" ? "half" : order.ticket_type === "courtesy" ? "courtesy" : "full";
    const ticketConfig = eventConfig.ticketTypes[ticketType];

    return [
      order.reservation_code,
      relationTicketCode(order.tickets) ?? "",
      order.buyer_name,
      formatPhone(order.buyer_phone),
      order.buyer_email ?? "",
      maskCpf(order.buyer_cpf),
      ticketConfig.label,
      relationLabel(order.seats),
      Number(order.ticket_price ?? ticketConfig.price).toFixed(2),
      order.created_at
    ].map(csvCell);
  });

  const csv = [header.map(csvCell), ...rows].map((row) => row.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=pedidos-pagos.csv"
    }
  });
}
