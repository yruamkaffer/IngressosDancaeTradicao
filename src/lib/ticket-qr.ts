import QRCode from "qrcode";
import { eventConfig } from "@/config/event";

export type TicketQrInput = {
  ticketCode: string;
  reservationCode: string;
  buyerName: string;
  buyerCpf: string;
  buyerPhone: string;
  ticketType: string;
  ticketTypeLabel: string;
  ticketPrice: number;
};

export function buildTicketQrPayload(input: TicketQrInput) {
  return JSON.stringify({
    eventId: eventConfig.id,
    eventName: eventConfig.name,
    ticketCode: input.ticketCode,
    reservationCode: input.reservationCode,
    cpf: input.buyerCpf,
    nome: input.buyerName,
    telefone: input.buyerPhone,
    tipoIngresso: input.ticketTypeLabel,
    tipoIngressoId: input.ticketType,
    valor: input.ticketPrice
  });
}

export async function buildTicketQrSvgDataUrl(input: TicketQrInput) {
  const svg = await QRCode.toString(buildTicketQrPayload(input), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 260
  });

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildTicketQrModules(input: TicketQrInput) {
  const qr = QRCode.create(buildTicketQrPayload(input), {
    errorCorrectionLevel: "M"
  });

  return {
    size: qr.modules.size,
    data: qr.modules.data
  };
}
