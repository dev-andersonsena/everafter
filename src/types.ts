export interface GiftItem {
  id: string;
  name: string;
  category: 'Cozinha' | 'Sala' | 'Quarto' | 'Lua de Mel' | 'Eletros' | 'Decoração';
  price: number;
  image: string;
  description: string;
  purchasedCount: number;
  isSuggested?: boolean;
}

export interface RSVPResponse {
  id: string;
  fullName: string;
  isAttending: boolean;
  companionCount: number;
  companions: string[];
  email?: string;
  phone?: string;
  dietaryRestrictions?: string;
  message?: string;
  submittedAt: string;
}

export interface EventDetails {
  date: string; // ISO format or string
  ceremonyTime: string;
  receptionTime: string;
  ceremonyLocation: string;
  receptionLocation: string;
  ceremonyAddress: string;
  receptionAddress: string;
  ceremonyMapsLink: string;
  receptionMapsLink: string;
  dressCode: string;
  dressCodeDescription: string;
  pixKey: string;
  pixName: string;
  pixBank: string;
}

export interface Guest {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  acompanhantes_limite: number;
  confirmado: boolean | null;
  acompanhantes: number;
  acompanhantes_nomes: string[];
  restricao_alimentar: string;
  mensagem: string;
  mesa: string;
  check_in: boolean;
  check_in_at: string | null;
  created_at: string;
}

export interface AccessLog {
  id: number;
  guest_id: string;
  data: string;
  ip: string;
  navegador: string;
  celular: string;
  cidade: string;
}
