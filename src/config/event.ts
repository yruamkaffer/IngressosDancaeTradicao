export const eventConfig = {
  id: "9a5773b8-2367-4ced-a455-03263f191f89",
  name: "Sob a Luz da Dança",
  edition: "14ª Mostra de Dança dos Alunos",
  callout: "Em 2026 nosso espetáculo será no MAIOR teatro de Joinville!",
  studioName: "Dança & Tradição Studio de Danças",
  studioLogoImage: "/danca-tradicao-logo.png",
  description:
    "Um espetáculo de dança realizado pela Dança & Tradição Studio de Danças, reunindo alunos, famílias e convidados em uma noite de palco, luz e celebração.",
  date: "2026-11-15",
  time: "20:00",
  location: "Teatro CENSUPEG (antigo Teatro da CNEC)",
  city: "Joinville",
  venueSummary:
    "Fachada e sala do teatro onde a apresentação acontece, com palco frontal, plateia organizada e acesso pelo Teatro CENSUPEG em Joinville.",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Teatro%20CENSUPEG%20Joinville%20antigo%20Teatro%20da%20CNEC",
  mapsEmbedUrl:
    "https://www.google.com/maps?q=Teatro%20CENSUPEG%20Joinville%20antigo%20Teatro%20da%20CNEC&output=embed",
  school: {
    name: "Dança & Tradição Studio de Danças",
    address: "R. Rio Doce, 673 - Guanabara, Joinville - SC, 89207-010",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Dan%C3%A7a%20%26%20Tradi%C3%A7%C3%A3o%20Studio%20de%20Dan%C3%A7as%20R.%20Rio%20Doce%20673%20Guanabara%20Joinville%20SC",
    phone: "(47) 99222-1742",
    phoneHref: "tel:+5547992221742",
    instagramHandle: "@dancaetradicao",
    instagramUrl: "https://www.instagram.com/dancaetradicao/?hl=en",
    facebookUrl: "https://web.facebook.com/DancaeTradicaoStudiodeDancas"
  },
  credits: {
    rightsOwner: "Dança & Tradição Studio de Danças",
    developer: "Yruam Käffer de Faria"
  },
  ticketTypes: {
    full: {
      id: "full",
      label: "Inteira",
      description: "Ingresso inteiro",
      price: 70,
      pixQrCodeImage: "/pix-qrcode-inteira.svg"
    },
    half: {
      id: "half",
      label: "Meia entrada / promocional",
      description: "Meia entrada ou valor promocional",
      price: 35,
      pixQrCodeImage: "/pix-qrcode-meia.svg"
    },
    courtesy: {
      id: "courtesy",
      label: "Cortesia da escola",
      description: "Ingresso gratuito emitido exclusivamente pela escola no painel admin",
      price: 0,
      pixQrCodeImage: "/pix-qrcode-placeholder.svg"
    }
  },
  ticketPrice: 70,
  maxSeatsPerOrder: 10,
  totalCapacity: 640,
  pixKey: "chave-pix-da-organizacao",
  pixReceiverName: "Dança & Tradição Studio de Danças",
  pixInstructions:
    "Compras pelo app aceitam somente Pix. Escolha inteira ou meia/promocional e pague usando o QR Code exibido para o tipo selecionado.",
  cashSalesNote: "Pagamento em dinheiro somente diretamente na escola.",
  whatsappPhone: "5511999999999",
  pixQrCodeImage: "/pix-qrcode-placeholder.svg",
  heroImage: "/palco-danca-composicao-20260626.png",
  venueImages: [
    {
      src: "/teatro-fachada.jpg",
      label: "Fachada",
      alt: "Fachada do Teatro CENSUPEG, antigo Teatro da CNEC, local do evento",
      caption: "Entrada principal do Teatro CENSUPEG"
    },
    {
      src: "/teatro-auditorio.jpg",
      label: "Auditório",
      alt: "Interior do Teatro CENSUPEG com palco e plateia",
      caption: "Palco frontal com plateia numerada"
    }
  ],
  arrivalNotice:
    "Os assentos nao serao numerados na compra. A distribuicao dos lugares sera feita por ordem de chegada ao evento; para garantir bons lugares, chegue cedo."
} as const;

export type TicketTypeId = keyof typeof eventConfig.ticketTypes;
