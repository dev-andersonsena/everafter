import { EventDetails, GiftItem } from './types';

export const weddingDetails: EventDetails = {
  date: '2026-09-07T15:00:00-03:00', // September 7, 2026 at 15:00 (Brasilia Time)
  ceremonyTime: '15:00',
  receptionTime: '16:30',
  ceremonyLocation: 'Prime Eventos',
  receptionLocation: 'Prime Eventos (Salão de Festas)',
  ceremonyAddress: 'R. Deoclécio Brito, 3399 - Planalto',
  receptionAddress: 'R. Deoclécio Brito, 3399 - Planalto',
  ceremonyMapsLink: 'https://maps.google.com/?q=Prime+Eventos+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto',
  receptionMapsLink: 'https://maps.google.com/?q=Prime+Eventos+R.+Deocl%C3%A9cio+Brito,+3399+-+Planalto',
  dressCode: 'Esporte Fino / Social',
  dressCodeDescription: 'Sugerimos que os homens usem calça social, camisa e blazer (gravata é opcional). Para as mulheres, vestidos longos ou midi em tons leves e elegantes (pedimos que evitem branco, off-white e cores muito próximas do branco).',
  pixKey: 'henderson.alana.casamento@gmail.com',
  pixName: 'Henderson Venicius e Alana Letícia',
  pixBank: 'Banco Nu Pagamentos (Nubank)'
};

export const giftItems: GiftItem[] = [
  {
    id: '1',
    name: 'Diária em Hotel de Charme',
    category: 'Lua de Mel',
    price: 650,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop',
    description: 'Uma diária inesquecível para os noivos relaxarem na serra gaúcha.',
    purchasedCount: 2,
    isSuggested: true
  },
  {
    id: '2',
    name: 'Jantar Romântico com Fondue',
    category: 'Lua de Mel',
    price: 350,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop',
    description: 'Um jantar clássico e romântico para os noivos saborearem a culinária local.',
    purchasedCount: 5,
    isSuggested: true
  },
  {
    id: '3',
    name: 'Espumante para Noite de Núpcias',
    category: 'Lua de Mel',
    price: 180,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600&auto=format&fit=crop',
    description: 'Um brinde especial para celebrar o primeiro dia da vida de casados.',
    purchasedCount: 0
  },
  {
    id: '4',
    name: 'Cafeteira Nespresso Elegance',
    category: 'Eletros',
    price: 480,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop',
    description: 'Para as manhãs cheias de energia e cafés cremosos na nova casa.',
    purchasedCount: 1,
    isSuggested: true
  },
  {
    id: '5',
    name: 'Jogo de Jantar 30 Peças Porcelana',
    category: 'Cozinha',
    price: 520,
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=600&auto=format&fit=crop',
    description: 'Um jogo de pratos finos para os noivos receberem a família com carinho.',
    purchasedCount: 0
  },
  {
    id: '6',
    name: 'Aspirador de Pó Robô Inteligente',
    category: 'Eletros',
    price: 890,
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=600&auto=format&fit=crop',
    description: 'Para manter a nova casa limpa com praticidade e tecnologia.',
    purchasedCount: 0,
    isSuggested: true
  },
  {
    id: '7',
    name: 'Jogo de Panelas Antiaderente Cerâmica',
    category: 'Cozinha',
    price: 430,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600&auto=format&fit=crop',
    description: 'Um jogo moderno e prático para as receitas especiais dos noivos.',
    purchasedCount: 1
  },
  {
    id: '8',
    name: 'Jogo de Lençóis de Fio Egípcio 400 Fios',
    category: 'Quarto',
    price: 320,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop',
    description: 'Muito conforto e maciez para os momentos de descanso do casal.',
    purchasedCount: 3
  },
  {
    id: '9',
    name: 'Fritadeira Elétrica Airfryer Digital',
    category: 'Eletros',
    price: 399,
    image: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?q=80&w=600&auto=format&fit=crop',
    description: 'Praticidade no preparo de pratos deliciosos e saudáveis.',
    purchasedCount: 0
  },
  {
    id: '10',
    name: 'Conjunto de Taças de Cristal Lapidado',
    category: 'Decoração',
    price: 240,
    image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?q=80&w=600&auto=format&fit=crop',
    description: 'Taças sofisticadas para comemorações importantes na nova casa.',
    purchasedCount: 2
  },
  {
    id: '11',
    name: 'Quadro Decorativo Abstrato Moderno',
    category: 'Decoração',
    price: 190,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop',
    description: 'Um toque artístico elegante e moderno para a decoração da sala de estar.',
    purchasedCount: 0
  },
  {
    id: '12',
    name: 'Cesta de Café da Manhã de Casados',
    category: 'Lua de Mel',
    price: 150,
    image: 'https://images.unsplash.com/photo-1513442542250-854d436a73f2?q=80&w=600&auto=format&fit=crop',
    description: 'Uma cesta farta de delícias para os noivos aproveitarem na manhã pós-casamento.',
    purchasedCount: 4
  }
];
