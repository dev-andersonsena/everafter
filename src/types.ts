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
