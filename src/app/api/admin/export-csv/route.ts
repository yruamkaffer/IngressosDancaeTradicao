import { eventConfig } from "@/config/event";
import { requestHasAdminSession } from "@/lib/admin-auth";
import { fail } from "@/lib/api";
import { formatPhone, maskCpf } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
      "id,buyer_name,buyer_phone,buyer_cpf,reservation_code,status,created_at,seats(label),tickets(ticket_code,used_at)"
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
    "cpf_mascarado",
    "assento",
    "valor",
    "criado_em"
  ];

  const rows = (data ?? []).map((order) => {
    const ticket = Array.isArray(order.tickets) ? order.tickets[0] : null;
    return [
      order.reservation_code,
      ticket?.ticket_code ?? "",
      order.buyer_name,
      formatPhone(order.buyer_phone),
      maskCpf(order.buyer_cpf),
      order.seats?.label ?? "",
      eventConfig.ticketPrice.toFixed(2),
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
