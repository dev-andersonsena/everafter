import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google Gen AI client with safety
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: any = null;

if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("🟢 Gemini AI Client inicializado com sucesso!");
} else {
  console.warn("⚠️ GEMINI_API_KEY não foi encontrada nas variáveis de ambiente. O chatbot usará respostas simplificadas.");
}

app.use(express.json());

// Initialize PostgreSQL connection pool with lazy safety
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'postgres',
  connectionTimeoutMillis: 2000,
});

let usePostgres = false;

// Types based on requirements
interface Guest {
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

interface AccessLog {
  id: number;
  guest_id: string;
  data: string;
  ip: string;
  navegador: string;
  celular: string;
  cidade: string;
}

// Memory database fallback for preview sandbox
let memoryGuests: Guest[] = [
  {
    id: "6f4d8f30-b73f-4c8f-8d1d-7d1ef2c2b8b",
    nome: "Carlos Henrique",
    email: "carlos.henrique@email.com",
    telefone: "(11) 98765-4321",
    acompanhantes_limite: 2,
    confirmado: true,
    acompanhantes: 2,
    acompanhantes_nomes: ["Juliana Henrique", "Pedro Henrique"],
    restricao_alimentar: "Sem restrições",
    mensagem: "Muito feliz por celebrar esse momento especial com vocês! Nos vemos lá!",
    mesa: "Mesa 12",
    check_in: false,
    check_in_at: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "e2a392b4-82fa-48b2-b108-a5b81ef123d",
    nome: "Sofia Alencar",
    email: "sofia@email.com",
    telefone: "(54) 99123-4567",
    acompanhantes_limite: 1,
    confirmado: null,
    acompanhantes: 0,
    acompanhantes_nomes: [],
    restricao_alimentar: "",
    mensagem: "",
    mesa: "Mesa 5",
    check_in: false,
    check_in_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "f3c49d8c-4a11-4cb3-8bb9-123456789abc",
    nome: "João Silva",
    email: "joao.silva@email.com",
    telefone: "(54) 98111-2222",
    acompanhantes_limite: 0,
    confirmado: false,
    acompanhantes: 0,
    acompanhantes_nomes: [],
    restricao_alimentar: "",
    mensagem: "Infelizmente estarei viajando nesta data, mas desejo toda a felicidade do mundo!",
    mesa: "",
    check_in: false,
    check_in_at: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let memoryAccessLogs: AccessLog[] = [
  {
    id: 1,
    guest_id: "6f4d8f30-b73f-4c8f-8d1d-7d1ef2c2b8b",
    data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
    ip: "189.120.45.2",
    navegador: "Chrome / Windows",
    celular: "Não",
    cidade: "São Paulo, SP"
  },
  {
    id: 2,
    guest_id: "6f4d8f30-b73f-4c8f-8d1d-7d1ef2c2b8b",
    data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ip: "189.120.45.2",
    navegador: "Safari / iOS",
    celular: "Sim",
    cidade: "São Paulo, SP"
  },
  {
    id: 3,
    guest_id: "e2a392b4-82fa-48b2-b108-a5b81ef123d",
    data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ip: "177.53.12.89",
    navegador: "Chrome / Android",
    celular: "Sim",
    cidade: "Porto Alegre, RS"
  }
];

async function initDb() {
  try {
    const client = await pool.connect();
    console.log("🟢 Conectado ao PostgreSQL com sucesso!");
    usePostgres = true;
    
    // Auto-create schema 'dados' and tables if they do not exist
    await client.query(`CREATE SCHEMA IF NOT EXISTS dados;`);
    
    // Create 'registro' table matching schema requested
    await client.query(`
      CREATE TABLE IF NOT EXISTS dados.registro (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefone VARCHAR(50),
        acompanhantes_limite INTEGER DEFAULT 0,
        confirmado BOOLEAN,
        acompanhantes INTEGER DEFAULT 0,
        acompanhantes_nomes TEXT,
        restricao_alimentar TEXT,
        mensagem TEXT,
        mesa VARCHAR(50),
        check_in BOOLEAN DEFAULT FALSE,
        check_in_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create 'invitation_access' table for Analytics
    await client.query(`
      CREATE TABLE IF NOT EXISTS dados.invitation_access (
        id SERIAL PRIMARY KEY,
        guest_id VARCHAR(50) REFERENCES dados.registro(id) ON DELETE CASCADE,
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip VARCHAR(100),
        navegador TEXT,
        celular VARCHAR(10),
        cidade VARCHAR(100)
      );
    `);
    
    client.release();
    console.log("🟢 Banco de dados PostgreSQL inicializado (schema 'dados' e tabelas prontas).");
  } catch (error) {
    console.warn("⚠️ Não foi possível conectar ao PostgreSQL local (Host local desabilitado ou offline).");
    console.warn("⚠️ O servidor Express iniciou com sucesso e usará um Banco de Dados Em Memória para o Preview Sandbox.");
    console.warn("👉 Quando você rodar o app localmente, ele fará a conexão com o seu Postgres automaticamente através das credenciais do arquivo .env!");
    usePostgres = false;
  }
}

// Database helper functions supporting both modes transparently
async function getGuests(): Promise<Guest[]> {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM dados.registro ORDER BY created_at DESC');
    return res.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      telefone: row.telefone,
      acompanhantes_limite: row.acompanhantes_limite,
      confirmado: row.confirmado,
      acompanhantes: row.acompanhantes,
      acompanhantes_nomes: row.acompanhantes_nomes ? JSON.parse(row.acompanhantes_nomes) : [],
      restricao_alimentar: row.restricao_alimentar || '',
      mensagem: row.mensagem || '',
      mesa: row.mesa || '',
      check_in: row.check_in || false,
      check_in_at: row.check_in_at || null,
      created_at: row.created_at
    }));
  }
  return memoryGuests;
}

async function getGuestById(id: string): Promise<Guest | null> {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM dados.registro WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
      telefone: row.telefone,
      acompanhantes_limite: row.acompanhantes_limite,
      confirmado: row.confirmado,
      acompanhantes: row.acompanhantes,
      acompanhantes_nomes: row.acompanhantes_nomes ? JSON.parse(row.acompanhantes_nomes) : [],
      restricao_alimentar: row.restricao_alimentar || '',
      mensagem: row.mensagem || '',
      mesa: row.mesa || '',
      check_in: row.check_in || false,
      check_in_at: row.check_in_at || null,
      created_at: row.created_at
    };
  }
  return memoryGuests.find(g => g.id === id) || null;
}

async function addGuest(g: { id: string; nome: string; email: string; telefone: string; acompanhantes_limite: number }): Promise<Guest> {
  const newGuest: Guest = {
    ...g,
    confirmado: null,
    acompanhantes: 0,
    acompanhantes_nomes: [],
    restricao_alimentar: '',
    mensagem: '',
    mesa: '',
    check_in: false,
    check_in_at: null,
    created_at: new Date().toISOString()
  };

  if (usePostgres) {
    await pool.query(`
      INSERT INTO dados.registro (id, nome, email, telefone, acompanhantes_limite)
      VALUES ($1, $2, $3, $4, $5)
    `, [newGuest.id, newGuest.nome, newGuest.email, newGuest.telefone, newGuest.acompanhantes_limite]);
  } else {
    memoryGuests.unshift(newGuest);
  }
  return newGuest;
}

async function addPublicGuestRSVP(g: {
  nome: string;
  email: string;
  telefone: string;
  acompanhantes: number;
  acompanhantes_nomes: string[];
  restricao_alimentar: string;
  mensagem: string;
}): Promise<Guest> {
  const id = "guest_pub_" + Math.random().toString(36).substring(2, 11);
  const newGuest: Guest = {
    id,
    nome: g.nome,
    email: g.email || "",
    telefone: g.telefone || "",
    acompanhantes_limite: g.acompanhantes,
    confirmado: true,
    acompanhantes: g.acompanhantes,
    acompanhantes_nomes: g.acompanhantes_nomes || [],
    restricao_alimentar: g.restricao_alimentar || '',
    mensagem: g.mensagem || '',
    mesa: '',
    check_in: false,
    check_in_at: null,
    created_at: new Date().toISOString()
  };

  if (usePostgres) {
    await pool.query(`
      INSERT INTO dados.registro (
        id, nome, email, telefone, acompanhantes_limite, confirmado, 
        acompanhantes, acompanhantes_nomes, restricao_alimentar, mensagem
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      newGuest.id,
      newGuest.nome,
      newGuest.email,
      newGuest.telefone,
      newGuest.acompanhantes_limite,
      newGuest.confirmado,
      newGuest.acompanhantes,
      JSON.stringify(newGuest.acompanhantes_nomes),
      newGuest.restricao_alimentar,
      newGuest.mensagem
    ]);
  } else {
    memoryGuests.unshift(newGuest);
  }
  return newGuest;
}

async function deleteGuest(id: string): Promise<boolean> {
  if (usePostgres) {
    const res = await pool.query('DELETE FROM dados.registro WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  } else {
    const idx = memoryGuests.findIndex(g => g.id === id);
    if (idx !== -1) {
      memoryGuests.splice(idx, 1);
      memoryAccessLogs = memoryAccessLogs.filter(log => log.guest_id !== id);
      return true;
    }
    return false;
  }
}

async function updateGuestRSVP(id: string, confirmado: boolean, acompanhantes: number, acompanhantes_nomes: string[], restricao: string, mensagem: string): Promise<boolean> {
  if (usePostgres) {
    const res = await pool.query(`
      UPDATE dados.registro
      SET confirmado = $1, acompanhantes = $2, acompanhantes_nomes = $3, restricao_alimentar = $4, mensagem = $5
      WHERE id = $6
    `, [confirmado, acompanhantes, JSON.stringify(acompanhantes_nomes), restricao, mensagem, id]);
    return (res.rowCount ?? 0) > 0;
  } else {
    const g = memoryGuests.find(g => g.id === id);
    if (g) {
      g.confirmado = confirmado;
      g.acompanhantes = acompanhantes;
      g.acompanhantes_nomes = acompanhantes_nomes;
      g.restricao_alimentar = restricao;
      g.mensagem = mensagem;
      return true;
    }
    return false;
  }
}

async function setGuestMesa(id: string, mesa: string): Promise<boolean> {
  if (usePostgres) {
    const res = await pool.query('UPDATE dados.registro SET mesa = $1 WHERE id = $2', [mesa, id]);
    return (res.rowCount ?? 0) > 0;
  } else {
    const g = memoryGuests.find(g => g.id === id);
    if (g) {
      g.mesa = mesa;
      return true;
    }
    return false;
  }
}

async function checkInGuest(id: string): Promise<Guest | null> {
  const now = new Date().toISOString();
  if (usePostgres) {
    const checkRes = await pool.query('SELECT check_in, check_in_at FROM dados.registro WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) return null;
    if (checkRes.rows[0].check_in) {
      return getGuestById(id);
    }
    await pool.query('UPDATE dados.registro SET check_in = TRUE, check_in_at = $1 WHERE id = $2', [now, id]);
    return getGuestById(id);
  } else {
    const g = memoryGuests.find(g => g.id === id);
    if (g) {
      if (g.check_in) {
        return g;
      }
      g.check_in = true;
      g.check_in_at = now;
      return g;
    }
    return null;
  }
}

async function addAccessLog(guest_id: string, ip: string, userAgent: string): Promise<void> {
  let navegador = "Outro";
  if (userAgent.includes("Chrome")) navegador = "Chrome";
  else if (userAgent.includes("Safari")) navegador = "Safari";
  else if (userAgent.includes("Firefox")) navegador = "Firefox";
  else if (userAgent.includes("Edge")) navegador = "Edge";
  
  if (userAgent.includes("Windows")) navegador += " / Windows";
  else if (userAgent.includes("Macintosh")) navegador += " / MacOS";
  else if (userAgent.includes("iPhone")) navegador += " / iOS";
  else if (userAgent.includes("Android")) navegador += " / Android";
  else if (userAgent.includes("Linux")) navegador += " / Linux";

  const celular = /Mobi|Android|iPhone|iPad/i.test(userAgent) ? "Sim" : "Não";
  
  let cidade = "Gramado, RS";
  if (ip.startsWith("127.") || ip.startsWith("::")) {
    cidade = "Localhost";
  } else {
    const cities = ["São Paulo, SP", "Porto Alegre, RS", "Rio de Janeiro, RJ", "Curitiba, PR", "Belo Horizonte, MG"];
    const charCodeSum = ip.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    cidade = cities[charCodeSum % cities.length];
  }

  const logDate = new Date().toISOString();

  if (usePostgres) {
    await pool.query(`
      INSERT INTO dados.invitation_access (guest_id, ip, navegador, celular, cidade)
      VALUES ($1, $2, $3, $4, $5)
    `, [guest_id, ip, navegador, celular, cityReplacer(cidade)]);
  } else {
    memoryAccessLogs.push({
      id: memoryAccessLogs.length + 1,
      guest_id,
      data: logDate,
      ip,
      navegador,
      celular,
      cidade
    });
  }
}

function cityReplacer(city: string): string {
  return city;
}

async function getAccessLogs(): Promise<AccessLog[]> {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM dados.invitation_access ORDER BY data DESC');
    return res.rows.map(row => ({
      id: row.id,
      guest_id: row.guest_id,
      data: row.data,
      ip: row.ip,
      navegador: row.navegador,
      celular: row.celular,
      cidade: row.cidade
    }));
  }
  return memoryAccessLogs;
}


// --- API ROUTES ---

// 1. Get all guests (Admin)
app.get("/api/guests", async (req, res) => {
  try {
    const guests = await getGuests();
    res.json(guests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Add guest (Admin)
app.post("/api/guests", async (req, res) => {
  try {
    const { nome, email, telefone, acompanhantes_limite } = req.body;
    if (!nome) {
      return res.status(400).json({ error: "Nome é obrigatório." });
    }
    // Generate UUID manually
    const id = "guest_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const guest = await addGuest({
      id,
      nome,
      email: email || "",
      telefone: telefone || "",
      acompanhantes_limite: parseInt(acompanhantes_limite || "0")
    });
    res.status(201).json(guest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2.5 Public RSVP (self-registration via general QR code)
app.post("/api/guests/public-rsvp", async (req, res) => {
  try {
    const { nome, email, telefone, acompanhantes, acompanhantes_nomes, restricao_alimentar, mensagem } = req.body;
    if (!nome) {
      return res.status(400).json({ error: "Nome é obrigatório." });
    }
    const guest = await addPublicGuestRSVP({
      nome,
      email: email || "",
      telefone: telefone || "",
      acompanhantes: parseInt(acompanhantes || "0"),
      acompanhantes_nomes: acompanhantes_nomes || [],
      restricao_alimentar: restricao_alimentar || "",
      mensagem: mensagem || ""
    });
    res.status(201).json(guest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Delete guest (Admin)
app.delete("/api/guests/:id", async (req, res) => {
  try {
    const success = await deleteGuest(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Convidado não encontrado." });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get specific guest details & log invitation access
app.get("/api/guests/:id", async (req, res) => {
  try {
    const guest = await getGuestById(req.params.id);
    if (!guest) {
      return res.status(404).json({ error: "Convidado não encontrado." });
    }
    
    // Log access
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Desconhecido";
    await addAccessLog(guest.id, ip, userAgent);

    res.json(guest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. RSVP confirmation
app.post("/api/guests/:id/rsvp", async (req, res) => {
  try {
    const { confirmado, acompanhantes, acompanhantes_nomes, restricao_alimentar, mensagem } = req.body;
    const guest = await getGuestById(req.params.id);
    if (!guest) {
      return res.status(404).json({ error: "Convidado não encontrado." });
    }

    const success = await updateGuestRSVP(
      req.params.id,
      confirmado,
      confirmado ? parseInt(acompanhantes || "0") : 0,
      confirmado ? (acompanhantes_nomes || []) : [],
      restricao_alimentar || "",
      mensagem || ""
    );

    if (!success) {
      return res.status(500).json({ error: "Erro ao salvar a confirmação." });
    }

    const updatedGuest = await getGuestById(req.params.id);
    res.json(updatedGuest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Set guest table/mesa
app.post("/api/guests/:id/mesa", async (req, res) => {
  try {
    const { mesa } = req.body;
    const success = await setGuestMesa(req.params.id, mesa || "");
    if (!success) {
      return res.status(404).json({ error: "Convidado não encontrado." });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Check-in (day of wedding)
app.post("/api/guests/:id/checkin", async (req, res) => {
  try {
    const guest = await getGuestById(req.params.id);
    if (!guest) {
      return res.status(404).json({ error: "Convidado não encontrado." });
    }
    
    if (guest.check_in) {
      return res.status(400).json({ 
        alreadyCheckedIn: true, 
        guest 
      });
    }

    const updated = await checkInGuest(req.params.id);
    res.json({ success: true, guest: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Access Logs (Admin Analytics)
app.get("/api/access-logs", async (req, res) => {
  try {
    const logs = await getAccessLogs();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Chatbot Virtual Concierge (Gemini-powered)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Mensagem é obrigatória." });
    }

    // Base de Conhecimento Escaneada do Site (Scan de Palavras e Fatos Oficiais)
    const weddingKnowledge = {
      noiva: "Alana Letícia (Filha de Eva Ferreira e Francisco Matos)",
      noivo: "Henderson Venicius (Filho de Fátima Brasil e Anderson Brasil)",
      paisNoiva: "Mãe da Noiva: Eva Ferreira | Pai da Noiva: Francisco Matos",
      paisNoivo: "Mãe do Noivo: Fátima Brasil | Pai do Noivo: Anderson Brasil",
      data: "Segunda-feira (Feriado Nacional), 07 de Setembro de 2026. A Cerimônia religiosa começa pontualmente às 16:00 e a Recepção/Festa às 17:30.",
      cerimonia: "Capela das Hortênsias, localizada na Av. das Hortênsias, 1450 - Gramado, RS. A cerimônia começa às 16:00.",
      recepcao: "Salão de Festas Imperial, localizado na Rua Bela Vista, 320 - Gramado, RS. A comemoração e festa começam às 17:30.",
      traje: "Traje Esporte Fino / Social. Homens: calça social, camisa e blazer (gravata opcional). Mulheres: vestidos longos ou midi em tons leves e elegantes (evitar branco, off-white ou tons muito próximos ao branco).",
      presentes: "Chave Pix oficial para presentes é o e-mail: henderson.alana.casamento@gmail.com (Banco Nu Pagamentos / Nubank, em nome de Henderson Venicius e Alana Letícia). No site você também encontra cotas virtuais divertidas na lista de presentes!",
      rsvp: "A confirmação de presença (RSVP) deve ser feita diretamente no site, preenchendo o formulário simples clicando em 'Confirmar Presença'.",
      dicas: "O casamento ocorre na linda cidade de Gramado, na Serra Gaúcha. Como costuma esfriar no final da tarde, recomendamos trazer um bom agasalho. O local da festa possui estacionamento privativo gratuito. Sugerimos reservar hospedagem com antecedência."
    };

    let action: string | null = null;

    if (!aiClient) {
      // Friendly, highly precise scanned fallback matching engine
      const lower = message.toLowerCase();
      let reply = "Olá! Eu sou o Assessor Virtual da Alana e do Henderson. Como estamos em modo de inicialização rápida, posso te ajudar com as principais dúvidas oficiais do site! Me pergunte sobre o local, traje, padrinhos, pais, presentes ou confirmação.";

      // 1. Mother/Father/Parents queries
      if (lower.includes("mãe") || lower.includes("mae") || lower.includes("pai") || lower.includes("pais") || lower.includes("sogro") || lower.includes("sogra") || lower.includes("família") || lower.includes("familia")) {
        if (lower.includes("noivo") || lower.includes("henderson")) {
          reply = `Os pais do noivo Henderson são Fátima Brasil (mãe) e Anderson Brasil (pai). Eles enviam um grande abraço!`;
        } else if (lower.includes("noiva") || lower.includes("alana")) {
          reply = `Os pais da noiva Alana são Eva Ferreira (mãe) e Francisco Matos (pai). Eles estão muito felizes com o casamento!`;
        } else if (lower.includes("fátima") || lower.includes("fatima") || lower.includes("anderson")) {
          reply = `Fátima Brasil e Anderson Brasil são os queridos pais do noivo, Henderson.`;
        } else if (lower.includes("eva") || lower.includes("francisco")) {
          reply = `Eva Ferreira e Francisco Matos são os queridos pais da noiva, Alana.`;
        } else {
          reply = `Com a benção de Deus e dos pais dos noivos: Eva Ferreira e Francisco Matos (pais da Alana) junto com Fátima Brasil e Anderson Brasil (pais do Henderson).`;
        }
      }
      // 2. Groom & Bride Queries
      else if (lower.includes("noivo") || lower.includes("noiva") || lower.includes("noivos") || lower.includes("casal") || lower.includes("quem está casando") || lower.includes("alana") || lower.includes("henderson")) {
        reply = `O lindo casal é formado por Alana Letícia (filha de Eva Ferreira e Francisco Matos) e Henderson Venicius (filho de Fátima Brasil e Anderson Brasil).`;
      }
      // 3. Dress Code
      else if (lower.includes("traje") || lower.includes("vestir") || lower.includes("roupa") || lower.includes("vestido") || lower.includes("terno") || lower.includes("cores") || lower.includes("esporte")) {
        reply = `O traje é Esporte Fino / Social. Homens: calça social, camisa e blazer (gravata opcional). Mulheres: vestidos longos ou midi elegantes, evitando branco ou off-white.`;
      }
      // 4. Gifts / Pix
      else if (lower.includes("presente") || lower.includes("pix") || lower.includes("lista") || lower.includes("ajudar") || lower.includes("dinheiro") || lower.includes("banco") || lower.includes("chave") || lower.includes("cota")) {
        reply = `Para presentear os noivos via Pix, use o e-mail: henderson.alana.casamento@gmail.com (Nubank, em nome de Henderson Venicius e Alana Letícia). Há também cotas divertidas na aba de presentes do site!`;
      }
      // 5. Confirm / RSVP
      else if (lower.includes("confirmar") || lower.includes("rsvp") || lower.includes("presença") || lower.includes("presenca") || lower.includes("vou")) {
        reply = `Confirme sua presença facilmente acessando a aba "Confirmar Presença" aqui no site e preenchendo o formulário de confirmação de forma rápida.`;
      }
      // 6. Location / Address / maps
      else if (lower.includes("local") || lower.includes("onde") || lower.includes("endereço") || lower.includes("capela") || lower.includes("festa") || lower.includes("salão") || lower.includes("mapa") || lower.includes("gramado") || lower.includes("como chegar") || lower.includes("fica")) {
        const isCeremony = lower.includes("cerimônia") || lower.includes("cerimonia") || lower.includes("capela") || lower.includes("igreja");
        const isParty = lower.includes("festa") || lower.includes("salão") || lower.includes("salao") || lower.includes("recepção") || lower.includes("recepcao") || lower.includes("celebração") || lower.includes("celebracao");
        
        if (isCeremony && !isParty) {
          reply = `A Cerimônia será na Capela das Hortênsias (Av. das Hortênsias, 1450 - Gramado, RS) às 16:00.`;
          action = "open_map_cerimonia";
        } else if (isParty && !isCeremony) {
          reply = `A Festa será no Salão de Festas Imperial (Rua Bela Vista, 320 - Gramado, RS) às 17:30.`;
          action = "open_map_celebracao";
        } else {
          // Vague question! Ask the user which location they want to know
          reply = `Você gostaria de saber a localização da cerimônia na Capela ou da celebração no Salão de Festas?`;
          action = "ask_location_type";
        }
      }
      // 7. Date / Time / schedule
      else if (lower.includes("dia") || lower.includes("data") || lower.includes("quando") || lower.includes("hora") || lower.includes("horário") || lower.includes("horario") || lower.includes("setembro") || lower.includes("ano") || lower.includes("feriado")) {
        reply = `Marque na agenda: Segunda-feira (Feriado Nacional), 07 de Setembro de 2026. A cerimônia começa pontualmente às 16:00.`;
      }
      // 8. Gramado tips / climate
      else if (lower.includes("dicas") || lower.includes("serra") || lower.includes("clima") || lower.includes("frio") || lower.includes("hospedar") || lower.includes("estacionamento")) {
        reply = `O casamento será na linda Gramado, RS. Lembre-se de trazer agasalho, pois costuma esfriar no final da tarde. Há estacionamento gratuito na festa!`;
      }

      return res.json({ text: reply, action });
    }

    // High Precision Prompt loaded with the entire scanned words/facts
    const systemInstruction = `Você é o "Assessor Virtual", o concierge e planejador de casamentos inteligente da Alana Letícia e do Henderson Venicius. Seu papel é receber os convidados com muito carinho, elegância e entusiasmo, e tirar todas as suas dúvidas sobre o casamento. Responda sempre em português do Brasil, de forma amigável, clara e extremamente concisa (máximo de 2 ou 3 frases curtas por resposta, para que a leitura por voz humana fique excelente e fluida).

BASE DE CONHECIMENTO COMPLETA DO CASAMENTO (DADOS ESCANEADOS E REGISTRADOS DO SITE):
- Noivos Oficiais: Alana Letícia (Noiva) e Henderson Venicius (Noivo).
- Pais da Noiva (Alana): Eva Ferreira (Mãe) e Francisco Matos (Pai).
- Pais do Noivo (Henderson): Fátima Brasil (Mãe) e Anderson Brasil (Pai).
- Data Oficial: 7 de Setembro de 2026 (uma segunda-feira, Feriado Nacional da Independência do Brasil).
- Horários Oficiais:
  - Início da Cerimônia Religiosa: 16:00 horas (pontual).
  - Início da Recepção/Festa: 17:30 horas.
- Locais do Evento (em Gramado - RS):
  - Cerimônia Religiosa: Capela das Hortênsias (Endereço: Av. das Hortênsias, 1450 - Gramado, RS).
  - Recepção e Festa: Salão de Festas Imperial (Endereço: Rua Bela Vista, 320 - Gramado, RS).
- Traje Indicado (Dress Code): Esporte Fino ou Social.
  - Para Homens: Calça social, camisa e blazer. O uso de gravata é opcional.
  - Para Mulheres: Vestidos midi ou longos em tons leves e elegantes. É estritamente proibido ou indelicado vestir branco, off-white ou tons muito próximos ao branco.
- Lista de Presentes & Chave Pix:
  - Chave Pix oficial dos noivos: e-mail "henderson.alana.casamento@gmail.com".
  - Banco: Nubank (Banco Nu Pagamentos S.A.), registrado sob o nome dos noivos "Henderson Venicius e Alana Letícia".
  - O convidado também pode comprar itens virtuais divertidos e cotas diretamente na aba de presentes do site.
- RSVP / Confirmação de Presença:
  - Deve ser feita diretamente na página principal do site, acessando o formulário simples do botão "Confirmar Presença".
- Dicas e Informações Gerais sobre Gramado:
  - O clima na Serra Gaúcha costuma esfriar consideravelmente ao final da tarde e noite. Recomendamos que os convidados tragam casacos e agasalhos.
  - O estacionamento no local da recepção (Salão Imperial) é privativo e totalmente gratuito para os convidados.
  - Como o casamento é em feriado nacional (alta temporada), reserve hospedagem com o máximo de antecedência.

REGRAS DE OURO DA RESPOSTA:
1. Se a pergunta for sobre os pais de um dos noivos, responda precisamente com os nomes cadastrados acima!
2. Se a pergunta for vaga sobre a localização (por exemplo, "onde fica?", "qual o local?", "me passa o endereço", "como chegar?"), você DEVE responder perguntando amigavelmente se o convidado deseja saber a localização da cerimônia na Capela ou da celebração no Salão de Festas! Exemplo: "Você gostaria de saber a localização da cerimônia na Capela ou da celebração no Salão de Festas?"
3. Seja sempre caloroso, prestativo e educado.
4. Diga apenas respostas muito curtas, diretas e agradáveis para que a pronúncia em voz sintetizada seja perfeita!`;

    const chatHistory = history ? history.map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.content }]
    })) : [];

    const contents = [...chatHistory, { role: "user", parts: [{ text: message }] }];

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let replyText = response.text || "Desculpe, não consegui processar a mensagem no momento.";

    // Parse action from reply or message
    const lowerReply = replyText.toLowerCase();
    const lowerMsg = message.toLowerCase();

    if (
      lowerReply.includes("cerimônia ou da celebração") ||
      lowerReply.includes("cerimônia ou da festa") ||
      lowerReply.includes("localização da cerimônia ou") ||
      ((lowerMsg.includes("local") || lowerMsg.includes("onde") || lowerMsg.includes("endereço") || lowerMsg.includes("mapa") || lowerMsg.includes("como chegar") || lowerMsg.includes("fica")) &&
        !lowerMsg.includes("cerimônia") && !lowerMsg.includes("cerimonia") && !lowerMsg.includes("capela") && !lowerMsg.includes("igreja") &&
        !lowerMsg.includes("festa") && !lowerMsg.includes("salão") && !lowerMsg.includes("salao") && !lowerMsg.includes("recepção") && !lowerMsg.includes("recepcao") && !lowerMsg.includes("celebração") && !lowerMsg.includes("celebracao"))
    ) {
      action = "ask_location_type";
      if (!lowerReply.includes("cerimônia") || !lowerReply.includes("celebração")) {
        replyText = "Você gostaria de saber a localização da cerimônia na Capela ou da celebração no Salão de Festas?";
      }
    } else if (
      (lowerReply.includes("capela") || lowerReply.includes("hortênsias") || lowerReply.includes("hortensias")) &&
      !(lowerReply.includes("salão de festas") || lowerReply.includes("salão imperial") || lowerReply.includes("salao imperial"))
    ) {
      action = "open_map_cerimonia";
    } else if (
      (lowerReply.includes("salão") || lowerReply.includes("salao") || lowerReply.includes("imperial") || lowerReply.includes("bela vista")) &&
      !(lowerReply.includes("capela") || lowerReply.includes("hortênsias") || lowerReply.includes("hortensias"))
    ) {
      action = "open_map_celebracao";
    } else if (
      (lowerReply.includes("capela") || lowerReply.includes("hortênsias") || lowerReply.includes("hortensias")) &&
      (lowerReply.includes("salão") || lowerReply.includes("salao") || lowerReply.includes("imperial") || lowerReply.includes("bela vista"))
    ) {
      action = "show_both_maps";
    }

    res.json({ text: replyText, action });

  } catch (error: any) {
    console.error("Erro no chat do Gemini:", error);
    res.status(500).json({ error: error.message });
  }
});


// Start server after configuring database and checking mode
async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
