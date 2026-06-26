import { normalizeCpf, normalizePhone } from "@/lib/format";

export function validateBuyer(input: {
  buyerName?: string;
  buyerPhone?: string;
  buyerCpf?: string;
  seatId?: string;
}) {
  const errors: Record<string, string> = {};
  const buyerName = input.buyerName?.trim() ?? "";
  const buyerPhone = normalizePhone(input.buyerPhone ?? "");
  const buyerCpf = normalizeCpf(input.buyerCpf ?? "");
  const seatId = input.seatId?.trim() ?? "";

  if (buyerName.length < 3) {
    errors.buyerName = "Informe o nome completo.";
  }
  if (buyerPhone.length < 10 || buyerPhone.length > 11) {
    errors.buyerPhone = "Informe um telefone valido com DDD.";
  }
  if (buyerCpf.length !== 11) {
    errors.buyerCpf = "Informe um CPF com 11 digitos.";
  }
  if (!seatId) {
    errors.seatId = "Escolha um assento disponível.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      buyerName,
      buyerPhone,
      buyerCpf,
      seatId
    }
  };
}
