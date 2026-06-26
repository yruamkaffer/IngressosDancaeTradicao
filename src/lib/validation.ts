import { eventConfig } from "@/config/event";
import { normalizeCpf, normalizePhone } from "@/lib/format";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBuyer(input: {
  buyerName?: string;
  buyerPhone?: string;
  buyerCpf?: string;
  buyerEmail?: string;
  seatId?: string;
  seatIds?: string[];
}) {
  const errors: Record<string, string> = {};
  const buyerName = input.buyerName?.trim() ?? "";
  const buyerPhone = normalizePhone(input.buyerPhone ?? "");
  const buyerCpf = normalizeCpf(input.buyerCpf ?? "");
  const buyerEmail = input.buyerEmail?.trim().toLowerCase() ?? "";
  const seatIds = Array.from(
    new Set(
      (input.seatIds && input.seatIds.length > 0 ? input.seatIds : input.seatId ? [input.seatId] : [])
        .map((seatId) => seatId.trim())
        .filter(Boolean)
    )
  );

  if (buyerName.length < 3) {
    errors.buyerName = "Informe o nome completo.";
  }
  if (buyerPhone.length < 10 || buyerPhone.length > 11) {
    errors.buyerPhone = "Informe um telefone valido com DDD.";
  }
  if (buyerCpf.length !== 11) {
    errors.buyerCpf = "Informe um CPF com 11 digitos.";
  }
  if (!emailPattern.test(buyerEmail)) {
    errors.buyerEmail = "Informe um email valido para envio do ticket.";
  }
  if (seatIds.length === 0) {
    errors.seatIds = "Escolha pelo menos um assento disponivel.";
  }
  if (seatIds.length > eventConfig.maxSeatsPerOrder) {
    errors.seatIds = `Escolha no maximo ${eventConfig.maxSeatsPerOrder} assentos por compra.`;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      buyerName,
      buyerPhone,
      buyerCpf,
      buyerEmail,
      seatIds,
      seatId: seatIds[0] ?? ""
    }
  };
}