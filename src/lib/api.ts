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

  if (message.includes("SEAT_NOT_AVAILABLE")) {
    return "Esse assento acabou de ficar indisponivel. Escolha outro assento.";
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
