import { eventConfig } from "@/config/event";
import { fail, friendlyDatabaseError, ok } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getGateApiKey() {
  return process.env.GATE_API_KEY?.trim() ?? "";
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() === "bearer" && token) {
    return token.trim();
  }

  return request.headers.get("x-gate-api-key")?.trim() ?? "";
}

function ticketCodeFromQrPayload(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^TCK-[A-Z0-9]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  try {
    const parsed = JSON.parse(trimmed) as { ticketCode?: unknown; ticket_code?: unknown; code?: unknown };
    const code = parsed.ticketCode ?? parsed.ticket_code ?? parsed.code;
    return typeof code === "string" ? code.trim().toUpperCase() : "";
  } catch {
    // Some scanners can be configured to send a URL instead of raw JSON.
  }

  try {
    const url = new URL(trimmed);
    return (
      url.searchParams.get("ticketCode") ??
      url.searchParams.get("ticket_code") ??
      url.searchParams.get("code") ??
      ""
    )
      .trim()
      .toUpperCase();
  } catch {
    return "";
  }
}

function getTicketCode(body: unknown) {
  if (!body || typeof body !== "object") {
    return "";
  }

  const input = body as {
    ticketCode?: unknown;
    ticket_code?: unknown;
    code?: unknown;
    qrPayload?: unknown;
    payload?: unknown;
    raw?: unknown;
  };
  const directCode = input.ticketCode ?? input.ticket_code ?? input.code;

  if (typeof directCode === "string" && directCode.trim()) {
    return directCode.trim().toUpperCase();
  }

  const qrPayload = input.qrPayload ?? input.payload ?? input.raw;
  return typeof qrPayload === "string" ? ticketCodeFromQrPayload(qrPayload) : "";
}

export async function POST(request: NextRequest) {
  const configuredKey = getGateApiKey();

  if (!configuredKey) {
    return fail("GATE_API_KEY nao configurada.", 503);
  }

  if (getBearerToken(request) !== configuredKey) {
    return fail("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  const ticketCode = getTicketCode(body);

  if (!ticketCode) {
    return fail("Informe ticketCode ou qrPayload.", 422);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("validate_ticket", {
    p_ticket_code: ticketCode
  });

  if (error) {
    return ok({
      allowed: false,
      reason: friendlyDatabaseError(error.message),
      code: error.message.includes("TICKET_NOT_FOUND") ? "TICKET_NOT_FOUND" : "VALIDATION_ERROR",
      ticketCode
    });
  }

  const validation = Array.isArray(data) ? data[0] : data;

  if (!validation) {
    return ok({
      allowed: false,
      reason: "Ticket nao encontrado.",
      code: "TICKET_NOT_FOUND",
      ticketCode
    });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,buyer_name,buyer_phone,buyer_cpf,ticket_type,ticket_price,reservation_code,status")
    .eq("id", validation.order_id)
    .maybeSingle();

  if (orderError || !order) {
    return ok({
      allowed: false,
      reason: "Ticket validado, mas nao foi possivel carregar o pedido.",
      code: "ORDER_LOAD_ERROR",
      ticketCode: validation.ticket_code,
      usedAt: validation.used_at
    });
  }

  const ticketType = order.ticket_type === "half" ? "half" : order.ticket_type === "courtesy" ? "courtesy" : "full";
  const ticketConfig = eventConfig.ticketTypes[ticketType];
  const ticketValue = Number(order.ticket_price ?? ticketConfig.price);
  const alreadyUsed = Boolean(validation.already_used);
  const paid = order.status === "paid";

  return ok({
    allowed: paid && !alreadyUsed,
    reason: !paid ? "Pedido nao esta pago." : alreadyUsed ? "Ticket ja utilizado." : "Entrada liberada.",
    code: !paid ? "ORDER_NOT_PAID" : alreadyUsed ? "ALREADY_USED" : "ALLOWED",
    ticketCode: validation.ticket_code,
    reservationCode: order.reservation_code,
    alreadyUsed,
    usedAt: validation.used_at,
    buyer: {
      name: order.buyer_name,
      cpf: order.buyer_cpf,
      phone: order.buyer_phone
    },
    ticket: {
      type: ticketType,
      typeLabel: ticketConfig.label,
      value: ticketValue
    },
    event: {
      id: eventConfig.id,
      name: eventConfig.name,
      edition: eventConfig.edition,
      date: eventConfig.date,
      time: eventConfig.time,
      location: eventConfig.location,
      city: eventConfig.city
    }
  });
}
