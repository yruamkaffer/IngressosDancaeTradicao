import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details
    },
    { status }
  );
}

export function friendlyDatabaseError(message?: string) {
  if (!message) {
    return "Nao foi possivel concluir a operacao. Tente novamente.";
  }

  if (message.includes("INVALID_SEAT_COUNT")) {
    return "Escolha de 1 a 10 ingressos por compra.";
  }
  if (message.includes("INVALID_TICKET_TYPE")) {
    return "Escolha um tipo de ingresso valido.";
  }
  if (message.includes("INVALID_BUYER_DATA")) {
    return "Revise os dados do comprador.";
  }
  if (message.includes("SEAT_NOT_AVAILABLE")) {
    return "Nao ha lugares disponiveis suficientes para essa quantidade.";
  }
  if (message.includes("SEAT_NOT_FOUND")) {
    return "Assento nao encontrado.";
  }
  if (message.includes("ORDER_NOT_FOUND")) {
    return "Reserva nao encontrada.";
  }
  if (message.includes("ORDER_NOT_PENDING")) {
    return "Somente reservas aguardando pagamento podem ser alteradas.";
  }
  if (message.includes("TICKET_NOT_FOUND")) {
    return "Ticket nao encontrado.";
  }

  return message;
}
