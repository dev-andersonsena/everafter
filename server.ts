import express, { type RequestHandler } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;
app.set("trust proxy", 1);

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

type AuthRole = "root" | "admin" | "recepcao";

interface AuthSession {
  role: AuthRole;
  username: string;
  expiresAt: number;
}

const AUTH_COOKIE_NAME = "everafter_staff_session";
const AUTH_SESSION_TTL_SECONDS = 8 * 60 * 60;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim() || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || String();
const ROOT_USERNAME = "root";
const ROOT_PASSWORD = process.env.ROOT_PASSWORD || String();
const RECEPTION_USERNAME = process.env.RECEPTION_USERNAME?.trim() || ADMIN_USERNAME;
const RECEPTION_PASSWORD = process.env.RECEPTION_PASSWORD || ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const loginAttempts = new Map<string, { failures: number; resetAt: number }>();

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET não configurado. As sessões serão invalidadas ao reiniciar o servidor.");
}


function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signSessionPayload(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function createSessionToken(role: AuthRole, username: string) {
  const session: AuthSession = {
    role,
    username,
    expiresAt: Date.now() + AUTH_SESSION_TTL_SECONDS * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signSessionPayload(payload)}`;
}

function parseCookies(cookieHeader?: string) {
  const cookies = new Map<string, string>();
  for (const cookie of (cookieHeader || "").split(";")) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex < 1) continue;
    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    if (!name) continue;
    try {
      cookies.set(name, decodeURIComponent(value));
    } catch {
      cookies.set(name, value);
    }
  }
  return cookies;
}

function getSession(cookieHeader?: string): AuthSession | null {
  const token = parseCookies(cookieHeader).get(AUTH_COOKIE_NAME);
  if (!token) return null;
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature) return null;
  const expectedSignature = signSessionPayload(payload);
  if (!safeEqual(providedSignature, expectedSignature)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession;
    if (
      (session.role !== "root" && session.role !== "admin" && session.role !== "recepcao") ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }
    // Keeps sessions created before ownership tracking compatible until they expire.
    if (!session.username) {
      session.username = session.role === "root"
        ? ROOT_USERNAME
        : session.role === "admin" ? ADMIN_USERNAME : RECEPTION_USERNAME;
    }
    return session;
  } catch {
    return null;
  }
}

function serializeSessionCookie(token: string, maxAge = AUTH_SESSION_TTL_SECONDS) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function requireRoles(...allowedRoles: AuthRole[]): RequestHandler {
  return (req, res, next) => {
    const session = getSession(req.headers.cookie);
    if (!session) return res.status(401).json({ error: "Autenticação necessária." });
    if (!allowedRoles.includes(session.role)) {
      return res.status(403).json({ error: "Você não tem permissão para esta operação." });
    }
    next();
  };
}

const requireAdmin = requireRoles("root", "admin");
const requireStaff = requireRoles("root", "admin", "recepcao");

app.post("/api/auth/login", (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const currentAttempt = loginAttempts.get(ip);
  if (currentAttempt && currentAttempt.resetAt > now && currentAttempt.failures >= 5) {
    return res.status(429).json({ error: "Muitas tentativas. Aguarde 15 minutos e tente novamente." });
  }
  if (currentAttempt && currentAttempt.resetAt <= now) loginAttempts.delete(ip);

  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const requestedRole = req.body?.role === "recepcao" ? "recepcao" : "admin";
  const role: AuthRole = requestedRole === "admin" && username === ROOT_USERNAME ? "root" : requestedRole;
  const expectedUsername = role === "root"
    ? ROOT_USERNAME
    : role === "recepcao" ? RECEPTION_USERNAME : ADMIN_USERNAME;
  const expectedPassword = role === "root"
    ? ROOT_PASSWORD
    : role === "recepcao" ? RECEPTION_PASSWORD : ADMIN_PASSWORD;
  const authenticated = Boolean(expectedPassword) &&
    safeEqual(username, expectedUsername) &&
    safeEqual(password, expectedPassword);

  if (!authenticated) {
    const attempt = loginAttempts.get(ip);
    loginAttempts.set(ip, {
      failures: (attempt?.failures || 0) + 1,
      resetAt: attempt?.resetAt && attempt.resetAt > now ? attempt.resetAt : now + 15 * 60 * 1000,
    });
    return res.status(401).json({ error: "Usuário ou senha incorretos." });
  }

  loginAttempts.delete(ip);
  res.setHeader("Set-Cookie", serializeSessionCookie(createSessionToken(role, username)));
  return res.json({ authenticated: true, role, username });
});

app.get("/api/auth/session", (req, res) => {
  const session = getSession(req.headers.cookie);
  if (!session) return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, role: session.role, username: session.username });
});

app.post("/api/auth/logout", (_req, res) => {
  res.setHeader("Set-Cookie", serializeSessionCookie("", 0));
  return res.json({ success: true });
});

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
  created_by?: string | null;
  creation_source?: "admin" | "public" | "companion_link" | "legacy";
  deleted_at?: string | null;
  deleted_by?: string | null;
  can_soft_delete?: boolean;
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
interface CompanionLink {
  hash: string;
  acompanhantes_limite: number;
  guest_id: string | null;
  guest_nome?: string | null;
  created_at: string;
  used_at: string | null;
  created_by?: string | null;
  can_soft_delete?: boolean;
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

let memoryCompanionLinks: CompanionLink[] = [];
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
        mensagem TEXT,
        mesa VARCHAR(50),
        check_in BOOLEAN DEFAULT FALSE,
        check_in_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Keep RSVP companion data on the guest record for reporting and check-in.
    try {
      await client.query(`ALTER TABLE dados.registro ADD COLUMN IF NOT EXISTS acompanhantes INTEGER NOT NULL DEFAULT 0;`);
      await client.query(`ALTER TABLE dados.registro ADD COLUMN IF NOT EXISTS acompanhantes_nomes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];`);
      await client.query(`ALTER TABLE dados.registro ADD COLUMN IF NOT EXISTS restricao_alimentar TEXT NOT NULL DEFAULT '';`);
      await client.query(`ALTER TABLE dados.registro ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);`);
      await client.query(`ALTER TABLE dados.registro ADD COLUMN IF NOT EXISTS creation_source VARCHAR(30) NOT NULL DEFAULT 'legacy';`);
      await client.query(`ALTER TABLE dados.registro ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;`);
      await client.query(`ALTER TABLE dados.registro ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);`);
      await client.query(`CREATE INDEX IF NOT EXISTS registro_active_idx ON dados.registro (created_at DESC) WHERE deleted_at IS NULL;`);
      console.log("🟢 Colunas desnecessárias removidas com sucesso (se existiam).");
    } catch (migError) {
      console.warn("⚠️ Nota sobre migração de colunas:", migError);
    }
    
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS dados.companion_links (
        hash VARCHAR(64) PRIMARY KEY,
        acompanhantes_limite INTEGER NOT NULL CHECK (acompanhantes_limite BETWEEN 1 AND 20),
        guest_id VARCHAR(50) UNIQUE REFERENCES dados.registro(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      );
    `);
    await client.query(`ALTER TABLE dados.companion_links ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);`);

    
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
    const res = await pool.query('SELECT * FROM dados.registro WHERE deleted_at IS NULL ORDER BY created_at DESC');
    return res.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      telefone: row.telefone,
      acompanhantes_limite: row.acompanhantes_limite || 0,
      confirmado: row.confirmado,
      acompanhantes: Number(row.acompanhantes) || 0,
      acompanhantes_nomes: Array.isArray(row.acompanhantes_nomes) ? row.acompanhantes_nomes : [],
      restricao_alimentar: row.restricao_alimentar || '',
      mensagem: row.mensagem || '',
      mesa: row.mesa || '',
      check_in: row.check_in || false,
      check_in_at: row.check_in_at || null,
      created_at: row.created_at,
      created_by: row.created_by,
      creation_source: row.creation_source,
      deleted_at: row.deleted_at,
      deleted_by: row.deleted_by
    }));
  }
  return memoryGuests.filter(guest => !guest.deleted_at);
}

async function getGuestById(id: string): Promise<Guest | null> {
  if (usePostgres) {
    const res = await pool.query('SELECT * FROM dados.registro WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
      telefone: row.telefone,
      acompanhantes_limite: row.acompanhantes_limite || 0,
      confirmado: row.confirmado,
      acompanhantes: Number(row.acompanhantes) || 0,
      acompanhantes_nomes: Array.isArray(row.acompanhantes_nomes) ? row.acompanhantes_nomes : [],
      restricao_alimentar: row.restricao_alimentar || '',
      mensagem: row.mensagem || '',
      mesa: row.mesa || '',
      check_in: row.check_in || false,
      check_in_at: row.check_in_at || null,
      created_at: row.created_at,
      created_by: row.created_by,
      creation_source: row.creation_source,
      deleted_at: row.deleted_at,
      deleted_by: row.deleted_by
    };
  }
  return memoryGuests.find(g => g.id === id && !g.deleted_at) || null;
}

async function addGuest(g: { id: string; nome: string; email: string; telefone: string; acompanhantes_limite: number }, createdBy: string): Promise<Guest> {
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
    created_at: new Date().toISOString(),
    created_by: createdBy,
    creation_source: 'admin',
    deleted_at: null,
    deleted_by: null
  };

  if (usePostgres) {
    await pool.query(`
      INSERT INTO dados.registro (id, nome, email, telefone, acompanhantes_limite, created_by, creation_source)
      VALUES ($1, $2, $3, $4, $5, $6, 'admin')
    `, [newGuest.id, newGuest.nome, newGuest.email, newGuest.telefone, newGuest.acompanhantes_limite, createdBy]);
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
  acompanhantes_limite?: number;
}): Promise<Guest> {
  const id = "guest_pub_" + Math.random().toString(36).substring(2, 11);
  const newGuest: Guest = {
    id,
    nome: g.nome,
    email: g.email || "",
    telefone: g.telefone || "",
    acompanhantes_limite: g.acompanhantes_limite || 0,
    confirmado: true,
    acompanhantes: g.acompanhantes,
    acompanhantes_nomes: g.acompanhantes_nomes,
    restricao_alimentar: g.restricao_alimentar,
    mensagem: g.mensagem || '',
    mesa: '',
    check_in: false,
    check_in_at: null,
    created_at: new Date().toISOString(),
    created_by: null,
    creation_source: 'public',
    deleted_at: null,
    deleted_by: null
  };

  if (usePostgres) {
    await pool.query(`
      INSERT INTO dados.registro (
        id, nome, email, telefone, acompanhantes_limite, confirmado, acompanhantes, acompanhantes_nomes, restricao_alimentar, mensagem, creation_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'public')
    `, [
      newGuest.id,
      newGuest.nome,
      newGuest.email,
      newGuest.telefone,
      newGuest.acompanhantes_limite,
      newGuest.confirmado,
      newGuest.acompanhantes,
      newGuest.acompanhantes_nomes,
      newGuest.restricao_alimentar,
      newGuest.mensagem
    ]);
  } else {
    memoryGuests.unshift(newGuest);
  }
  return newGuest;
}

function canSoftDeleteGuest(session: AuthSession, guest: Guest): boolean {
  if (session.role === "root") return true;
  return session.role === "admin"
    && guest.creation_source === "companion_link"
    && guest.created_by === session.username;
}

async function softDeleteGuest(id: string, session: AuthSession): Promise<"deleted" | "forbidden" | "not_found"> {
  if (usePostgres) {
    const lookup = await pool.query(
      'SELECT id, created_by, creation_source FROM dados.registro WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    if (lookup.rows.length === 0) return "not_found";
    const guest = lookup.rows[0] as Guest;
    if (!canSoftDeleteGuest(session, guest)) return "forbidden";
    await pool.query(
      'UPDATE dados.registro SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL',
      [session.username, id],
    );
    return "deleted";
  } else {
    const guest = memoryGuests.find(g => g.id === id && !g.deleted_at);
    if (!guest) return "not_found";
    if (!canSoftDeleteGuest(session, guest)) return "forbidden";
    guest.deleted_at = new Date().toISOString();
    guest.deleted_by = session.username;
    return "deleted";
  }
}

async function updateGuestRSVP(id: string, confirmado: boolean, acompanhantes: number, acompanhantes_nomes: string[], restricao: string, mensagem: string, telefone?: string, email?: string): Promise<boolean> {
  if (usePostgres) {
    const res = await pool.query(`
      UPDATE dados.registro
      SET confirmado = $1, 
          acompanhantes = $2,
          acompanhantes_nomes = $3,
          restricao_alimentar = $4,
          mensagem = $5,
          telefone = COALESCE(NULLIF($6, ''), telefone),
          email = COALESCE(NULLIF($7, ''), email)
      WHERE id = $8 AND deleted_at IS NULL
    `, [confirmado, acompanhantes, acompanhantes_nomes, restricao, mensagem, telefone || '', email || '', id]);
    return (res.rowCount ?? 0) > 0;
  } else {
    const g = memoryGuests.find(g => g.id === id && !g.deleted_at);
    if (g) {
      g.confirmado = confirmado;
      g.acompanhantes = acompanhantes;
      g.acompanhantes_nomes = acompanhantes_nomes;
      g.restricao_alimentar = restricao;
      g.mensagem = mensagem;
      if (telefone) g.telefone = telefone;
      if (email) g.email = email;
      return true;
    }
    return false;
  }
}

async function setGuestMesa(id: string, mesa: string): Promise<boolean> {
  if (usePostgres) {
    const res = await pool.query('UPDATE dados.registro SET mesa = $1 WHERE id = $2 AND deleted_at IS NULL', [mesa, id]);
    return (res.rowCount ?? 0) > 0;
  } else {
    const g = memoryGuests.find(g => g.id === id && !g.deleted_at);
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
    const checkRes = await pool.query('SELECT check_in, check_in_at FROM dados.registro WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (checkRes.rows.length === 0) return null;
    if (checkRes.rows[0].check_in) {
      return getGuestById(id);
    }
    await pool.query('UPDATE dados.registro SET check_in = TRUE, check_in_at = $1 WHERE id = $2 AND deleted_at IS NULL', [now, id]);
    return getGuestById(id);
  } else {
    const g = memoryGuests.find(g => g.id === id && !g.deleted_at);
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


async function getCompanionLinks(session: AuthSession): Promise<CompanionLink[]> {
  if (usePostgres) {
    const result = await pool.query(`
      SELECT links.*, registro.nome AS guest_nome, registro.created_by AS guest_created_by,
             registro.creation_source AS guest_creation_source, registro.deleted_at AS guest_deleted_at
      FROM dados.companion_links links
      LEFT JOIN dados.registro registro ON registro.id = links.guest_id
      ORDER BY links.created_at DESC
    `);
    return result.rows.map(row => ({
      ...row,
      guest_nome: row.guest_deleted_at ? null : row.guest_nome,
      can_soft_delete: Boolean(
        row.guest_id && !row.guest_deleted_at && (
          session.role === "root" || (
            session.role === "admin"
            && row.guest_creation_source === "companion_link"
            && row.guest_created_by === session.username
          )
        )
      ),
    }));
  }
  return [...memoryCompanionLinks].reverse().map(link => ({
    ...link,
    guest_nome: link.guest_id ? memoryGuests.find(guest => guest.id === link.guest_id && !guest.deleted_at)?.nome || null : null,
    can_soft_delete: Boolean(
      link.guest_id
      && memoryGuests.some(guest => guest.id === link.guest_id && !guest.deleted_at && canSoftDeleteGuest(session, guest))
    ),
  }));
}

async function getCompanionLink(hash: string): Promise<CompanionLink | null> {
  if (usePostgres) {
    const result = await pool.query(
      'SELECT * FROM dados.companion_links WHERE hash = $1',
      [hash],
    );
    return result.rows[0] || null;
  }
  return memoryCompanionLinks.find(link => link.hash === hash) || null;
}

async function createCompanionLink(acompanhantes_limite: number, createdBy: string): Promise<CompanionLink> {
  const hash = randomBytes(18).toString("hex");
  if (usePostgres) {
    const result = await pool.query(
      'INSERT INTO dados.companion_links (hash, acompanhantes_limite, created_by) VALUES ($1, $2, $3) RETURNING *',
      [hash, acompanhantes_limite, createdBy],
    );
    return result.rows[0];
  }

  const link: CompanionLink = {
    hash,
    acompanhantes_limite,
    guest_id: null,
    created_at: new Date().toISOString(),
    used_at: null,
    created_by: createdBy,
  };
  memoryCompanionLinks.push(link);
  return link;
}

type CompanionRsvpInput = {
  nome: string;
  email: string;
  telefone: string;
  acompanhantes: number;
  acompanhantes_nomes: string[];
  restricao_alimentar: string;
  mensagem: string;
};

async function redeemCompanionLink(hash: string, input: CompanionRsvpInput): Promise<Guest> {
  if (usePostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const linkResult = await client.query(
        'SELECT * FROM dados.companion_links WHERE hash = $1 FOR UPDATE',
        [hash],
      );
      const link = linkResult.rows[0];
      if (!link) throw new Error("LINK_NOT_FOUND");
      if (link.guest_id || link.used_at) throw new Error("LINK_ALREADY_USED");

      const guestId = "guest_comp_" + randomBytes(9).toString("hex");
      const createdAt = new Date().toISOString();
      await client.query(`
        INSERT INTO dados.registro (
          id, nome, email, telefone, acompanhantes_limite, confirmado,
          acompanhantes, acompanhantes_nomes, restricao_alimentar, mensagem,
          created_by, creation_source
        )
        VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, $9, $10, 'companion_link')
      `, [
        guestId,
        input.nome,
        input.email,
        input.telefone,
        link.acompanhantes_limite,
        input.acompanhantes,
        input.acompanhantes_nomes,
        input.restricao_alimentar,
        input.mensagem,
        link.created_by,
      ]);
      await client.query(
        'UPDATE dados.companion_links SET guest_id = $1, used_at = CURRENT_TIMESTAMP WHERE hash = $2',
        [guestId, hash],
      );
      await client.query('COMMIT');

      return {
        id: guestId,
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        acompanhantes_limite: link.acompanhantes_limite,
        confirmado: true,
        acompanhantes: input.acompanhantes,
        acompanhantes_nomes: input.acompanhantes_nomes,
        restricao_alimentar: input.restricao_alimentar,
        mensagem: input.mensagem,
        mesa: '',
        check_in: false,
        check_in_at: null,
        created_at: createdAt,
        created_by: link.created_by,
        creation_source: 'companion_link',
        deleted_at: null,
        deleted_by: null,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  const link = memoryCompanionLinks.find(candidate => candidate.hash === hash);
  if (!link) throw new Error("LINK_NOT_FOUND");
  if (link.guest_id || link.used_at) throw new Error("LINK_ALREADY_USED");

  const guest = await addPublicGuestRSVP({
    ...input,
    acompanhantes_limite: link.acompanhantes_limite,
  });
  guest.created_by = link.created_by || null;
  guest.creation_source = 'companion_link';
  link.guest_id = guest.id;
  link.used_at = new Date().toISOString();
  return guest;
}
// --- API ROUTES ---
// Companion-link management (Admin)
app.get("/api/companion-links", requireAdmin, async (req, res) => {
  try {
    const session = getSession(req.headers.cookie)!;
    res.json(await getCompanionLinks(session));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/companion-links", requireAdmin, async (req, res) => {
  try {
    const limit = Number.parseInt(String(req.body?.acompanhantes_limite), 10);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      return res.status(400).json({ error: "Informe uma quantidade entre 1 e 20 acompanhantes." });
    }
    const session = getSession(req.headers.cookie)!;
    res.status(201).json(await createCompanionLink(limit, session.username));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Public metadata used to render the restricted RSVP form.
app.get("/api/companion-links/:hash", async (req, res) => {
  try {
    const link = await getCompanionLink(req.params.hash);
    if (!link) return res.status(404).json({ error: "Link de acompanhantes inv\u00e1lido." });
    if (link.guest_id || link.used_at) return res.status(410).json({ error: "Este link j\u00e1 foi utilizado." });
    res.json({
      hash: link.hash,
      acompanhantes_limite: link.acompanhantes_limite,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/companion-links/:hash/rsvp", async (req, res) => {
  try {
    const link = await getCompanionLink(req.params.hash);
    if (!link) return res.status(404).json({ error: "Link de acompanhantes inv\u00e1lido." });
    if (link.guest_id || link.used_at) return res.status(410).json({ error: "Este link j\u00e1 foi utilizado." });

    const nome = typeof req.body?.nome === "string" ? req.body.nome.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const telefone = typeof req.body?.telefone === "string" ? req.body.telefone.trim() : "";
    const acompanhantes = Number.parseInt(String(req.body?.acompanhantes ?? 0), 10);
    const nomes = Array.isArray(req.body?.acompanhantes_nomes)
      ? req.body.acompanhantes_nomes.map((value: unknown) => typeof value === "string" ? value.trim() : "")
      : [];

    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: "Nome, e-mail e telefone s\u00e3o obrigat\u00f3rios." });
    }
    if (!Number.isInteger(acompanhantes) || acompanhantes < 0 || acompanhantes > link.acompanhantes_limite) {
      return res.status(400).json({ error: "Quantidade de acompanhantes acima do permitido para este link." });
    }
    if (nomes.length !== acompanhantes || nomes.some((value: string) => !value)) {
      return res.status(400).json({ error: "Informe o nome de todos os acompanhantes selecionados." });
    }

    const guest = await redeemCompanionLink(req.params.hash, {
      nome,
      email,
      telefone,
      acompanhantes,
      acompanhantes_nomes: nomes,
      restricao_alimentar: typeof req.body?.restricao_alimentar === "string" ? req.body.restricao_alimentar.trim() : "",
      mensagem: typeof req.body?.mensagem === "string" ? req.body.mensagem.trim() : "",
    });
    res.status(201).json(guest);
  } catch (error: any) {
    if (error?.message === "LINK_NOT_FOUND") {
      return res.status(404).json({ error: "Link de acompanhantes inv\u00e1lido." });
    }
    if (error?.message === "LINK_ALREADY_USED") {
      return res.status(410).json({ error: "Este link j\u00e1 foi utilizado." });
    }
    res.status(500).json({ error: error.message });
  }
});


// 1. Get all guests (Admin)
app.get("/api/guests", requireStaff, async (req, res) => {
  try {
    const guests = await getGuests();
    const session = getSession(req.headers.cookie)!;
    res.json(guests.map(guest => ({
      ...guest,
      can_soft_delete: canSoftDeleteGuest(session, guest),
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1.5. Search a guest securely by exact full name or unique invitation code
app.get("/api/guests/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 3) {
      return res.status(400).json({ error: "Por favor, digite ao menos 3 letras do nome completo ou o código do convite." });
    }

    const guests = await getGuests();
    const queryNormalized = q.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Restore the previous RSVP flow: accept similar names or an invitation code.
    const matched = guests.filter(g => {
      const dbNameNormalized = g.nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      
      const guestCode = g.id.startsWith("guest_") ? g.id.substring(6).toUpperCase() : g.id.toUpperCase();
      
      return (
        dbNameNormalized.includes(queryNormalized) ||
        queryNormalized.includes(dbNameNormalized) ||
        guestCode === q.trim().toUpperCase() ||
        g.id === q.trim()
      );
    });

    if (matched.length === 0) {
      return res.status(404).json({ error: "Nenhum convite encontrado. Verifique se digitou o nome completo igual ao convite ou o código correto." });
    }

    res.json(matched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Add guest (Admin)
app.post("/api/guests", requireAdmin, async (req, res) => {
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
    }, getSession(req.headers.cookie)!.username);
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
      acompanhantes: 0,
      acompanhantes_nomes: [],
      restricao_alimentar: restricao_alimentar || "",
      mensagem: mensagem || ""
    });
    res.status(201).json(guest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Soft-delete guest. Root may remove all; admin only companion records it owns.
app.delete("/api/guests/:id", requireAdmin, async (req, res) => {
  try {
    const result = await softDeleteGuest(req.params.id, getSession(req.headers.cookie)!);
    if (result === "not_found") {
      return res.status(404).json({ error: "Convidado não encontrado." });
    }
    if (result === "forbidden") {
      return res.status(403).json({ error: "O administrador só pode remover cadastros de acompanhantes gerados por seus próprios links." });
    }
    res.json({ success: true, soft_deleted: true });
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
    const { confirmado, acompanhantes, acompanhantes_nomes, restricao_alimentar, mensagem, telefone, email } = req.body;
    const guest = await getGuestById(req.params.id);
    if (!guest) {
      return res.status(404).json({ error: "Convidado não encontrado." });
    }

    const requestedCompanions = confirmado ? Number.parseInt(String(acompanhantes || 0), 10) : 0;
    const companionNames = confirmado && Array.isArray(acompanhantes_nomes) ? acompanhantes_nomes : [];
    if (
      requestedCompanions < 0 ||
      requestedCompanions > guest.acompanhantes_limite ||
      companionNames.length !== requestedCompanions
    ) {
      return res.status(400).json({ error: "Quantidade de acompanhantes inv\u00e1lida para este convite." });
    }

    const success = await updateGuestRSVP(
      req.params.id,
      confirmado,
      requestedCompanions,
      companionNames,
      restricao_alimentar || "",
      mensagem || "",
      telefone,
      email
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
app.post("/api/guests/:id/mesa", requireAdmin, async (req, res) => {
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
app.post("/api/guests/:id/checkin", requireStaff, async (req, res) => {
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
app.get("/api/access-logs", requireAdmin, async (req, res) => {
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
      data: "Segunda-feira (Feriado Nacional), 07 de Setembro de 2026. A Cerimônia começa pontualmente às 15:00.",
      cerimonia: "Prime Eventos, localizada em R. Deoclécio Brito, 3399 - Planalto. A cerimônia começa às 15:00.",
      traje: "Traje Esporte Fino / Social. Homens: calça social, camisa e blazer (gravata opcional). Mulheres: vestidos longos ou midi em tons leves e elegantes (evitar branco, off-white ou tons muito próximos ao branco).",
      presentes: "Chave Pix oficial para presentes é o e-mail: henderson.alana.casamento@gmail.com (Banco Nu Pagamentos / Nubank, em nome de Henderson Venicius e Alana Letícia). No site você também encontra cotas virtuais divertidas na lista de presentes!",
      rsvp: "A confirmação de presença (RSVP) deve ser feita diretamente no site, preenchendo o formulário simples clicando em 'Confirmar Presença'.",
      dicas: "O casamento ocorre no elegante espaço Prime Eventos, em R. Deoclécio Brito, 3399 - Planalto. O local do evento possui estacionamento privativo gratuito. Como o casamento é em feriado nacional, planeje seu deslocamento e hospedagem com antecedência."
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
      else if (lower.includes("local") || lower.includes("onde") || lower.includes("endereço") || lower.includes("prime") || lower.includes("festa") || lower.includes("salão") || lower.includes("mapa") || lower.includes("teresina") || lower.includes("como chegar") || lower.includes("fica")) {
        reply = `A Cerimônia será no Prime Eventos, localizado na R. Deoclécio Brito, 3399 - Planalto, às 15:00.`;
        action = "open_map_cerimonia";
      }
      // 7. Date / Time / schedule
      else if (lower.includes("dia") || lower.includes("data") || lower.includes("quando") || lower.includes("hora") || lower.includes("horário") || lower.includes("horario") || lower.includes("setembro") || lower.includes("ano") || lower.includes("feriado")) {
        reply = `Marque na agenda: Segunda-feira (Feriado Nacional), 07 de Setembro de 2026. A cerimônia começa pontualmente às 15:00.`;
      }
      // 8. Teresina tips / climate
      else if (lower.includes("dicas") || lower.includes("clima") || lower.includes("hospedar") || lower.includes("estacionamento")) {
        reply = `O casamento será no elegante Prime Eventos em Teresina, PI. O local conta com estacionamento gratuito para os convidados!`;
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
  - Início da Cerimônia: 15:00 horas (pontual).
- Local do Evento (em Teresina - PI):
  - Cerimônia: Prime Eventos (Endereço: R. Deoclécio Brito, 3399 - Planalto).
- Traje Indicado (Dress Code): Esporte Fino ou Social.
  - Para Homens: Calça social, camisa e blazer. O uso de gravata é opcional.
  - Para Mulheres: Vestidos midi ou longos em tons leves e elegantes. É estritamente proibido ou indelicado vestir branco, off-white ou tons muito próximos ao branco.
- Lista de Presentes & Chave Pix:
  - Chave Pix oficial dos noivos: e-mail "henderson.alana.casamento@gmail.com".
  - Banco: Nubank (Banco Nu Pagamentos S.A.), registrado sob o nome dos noivos "Henderson Venicius e Alana Letícia".
  - O convidado também pode comprar itens virtuais divertidos e cotas diretamente na aba de presentes do site.
- RSVP / Confirmação de Presença:
  - Deve ser feita diretamente na página principal do site, acessando o formulário simples do botão "Confirmar Presença".
- Dicas e Informações Gerais:
  - O estacionamento no local (Prime Eventos) é privativo e totalmente gratuito para os convidados.
  - Como o casamento é em feriado nacional, planeje seu deslocamento e hospedagem com antecedência.

REGRAS DE OURO DA RESPOSTA:
1. Se a pergunta for sobre os pais de um dos noivos, responda precisamente com os nomes cadastrados acima!
2. Se a pergunta for sobre a localização (por exemplo, "onde fica?", "qual o local?", "me passa o endereço", "como chegar?"), responda que a cerimônia será no Prime Eventos, localizado na R. Deoclécio Brito, 3399 - Planalto.
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
      lowerReply.includes("cerimônia no prime eventos") ||
      lowerReply.includes("cerimônia ou da celebração") ||
      lowerReply.includes("cerimônia ou da festa") ||
      lowerReply.includes("localização da cerimônia ou") ||
      ((lowerMsg.includes("local") || lowerMsg.includes("onde") || lowerMsg.includes("endereço") || lowerMsg.includes("mapa") || lowerMsg.includes("como chegar") || lowerMsg.includes("fica")) &&
        !lowerMsg.includes("cerimônia") && !lowerMsg.includes("cerimonia") && !lowerMsg.includes("prime") &&
        !lowerMsg.includes("festa") && !lowerMsg.includes("salão") && !lowerMsg.includes("salao") && !lowerMsg.includes("recepção") && !lowerMsg.includes("recepcao") && !lowerMsg.includes("celebração") && !lowerMsg.includes("celebracao"))
    ) {
      action = "ask_location_type";
      if (!lowerReply.includes("cerimônia") || !lowerReply.includes("celebração")) {
        replyText = "Você gostaria de saber a localização da cerimônia no Prime Eventos ou da celebração no Salão de Festas?";
      }
    } else if (
      (lowerReply.includes("prime eventos") || lowerReply.includes("prime") || lowerReply.includes("cerimônia") || lowerReply.includes("cerimonia")) &&
      !(lowerReply.includes("salão de festas") || lowerReply.includes("festa") || lowerReply.includes("recepção") || lowerReply.includes("recepcao"))
    ) {
      action = "open_map_cerimonia";
    } else if (
      (lowerReply.includes("salão") || lowerReply.includes("salao") || lowerReply.includes("festa") || lowerReply.includes("recepção") || lowerReply.includes("recepcao") || lowerReply.includes("celebrar")) &&
      !(lowerReply.includes("prime") || lowerReply.includes("cerimônia") || lowerReply.includes("cerimonia"))
    ) {
      action = "open_map_celebracao";
    } else if (
      (lowerReply.includes("prime") || lowerReply.includes("cerimônia") || lowerReply.includes("cerimonia")) &&
      (lowerReply.includes("salão") || lowerReply.includes("salao") || lowerReply.includes("festa") || lowerReply.includes("recepção") || lowerReply.includes("recepcao"))
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
