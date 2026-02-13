import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  issueAuthTokens,
  verifyAuthToken,
  type JwtPayload,
} from "../middleware/auth.js";
import { getClienteById, listClienteRiparazioni } from "./anagrafiche-service.js";
import { getRiparazioneDettaglio, listRiparazioni } from "./riparazioni-service.js";
import {
  createPortalAccountActivationNotifica,
  listNotifiche,
} from "./notifiche-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthUserRecord {
  id: number;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  passwordHash: string;
}

interface AuthSuccessPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: Role;
  };
}

interface PortalAuthSuccessPayload {
  accessToken: string;
  refreshToken: string;
  profileSummary?: {
    clienteId: number;
    codiceCliente: string;
    ragioneSociale: string;
  };
}

interface PortalDashboardEventPayload {
  tipo: string;
  riferimentoId: number;
  timestamp: string;
  descrizione: string;
}

interface PortalDashboardPayload {
  cliente: {
    id: number;
    codiceCliente: string;
    ragioneSociale: string;
  };
  stats: {
    ordiniAperti: number;
    riparazioniAttive: number;
    preventiviInAttesa: number;
  };
  eventiRecenti: PortalDashboardEventPayload[];
}

interface PortalOrdiniListItemPayload {
  id: number;
  codiceOrdine: string;
  stato: string;
  dataOrdine: string;
  tipoDispositivo: string;
}

interface PortalOrdiniListPayload {
  data: PortalOrdiniListItemPayload[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PortalOrdineTimelineItemPayload {
  stato: string;
  dataOra: string;
}

interface PortalOrdineDocumentoPayload {
  tipo: string;
  riferimentoId: number;
}

interface PortalOrdineDettaglioPayload {
  id: number;
  stato: string;
  importi: {
    totalePreventivi: number;
    totalePagato: number;
    saldoResiduo: number;
  };
  timeline: PortalOrdineTimelineItemPayload[];
  documentiCollegati: PortalOrdineDocumentoPayload[];
}

type LoginFailureCode = "INVALID_CREDENTIALS" | "ACCOUNT_DISABLED";
type RefreshFailureCode = "INVALID_REFRESH_TOKEN" | "ACCOUNT_DISABLED";
type PortalCreateFailureCode =
  | "CUSTOMER_EMAIL_REQUIRED"
  | "PORTAL_ACCOUNT_ALREADY_EXISTS"
  | "SERVICE_UNAVAILABLE";
type PortalActivateFailureCode =
  | "INVALID_ACTIVATION_TOKEN"
  | "WEAK_PASSWORD"
  | "SERVICE_UNAVAILABLE";
type PortalLoginFailureCode = "INVALID_CREDENTIALS" | "SERVICE_UNAVAILABLE";
type PortalRefreshFailureCode = "INVALID_REFRESH_TOKEN" | "ACCOUNT_DISABLED";
type PortalLogoutFailureCode = "INVALID_REFRESH_TOKEN";
type PortalDashboardFailureCode = "UNAUTHORIZED" | "SERVICE_UNAVAILABLE";
type PortalOrdiniFailureCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SERVICE_UNAVAILABLE";
type AuthFailureCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_DISABLED"
  | "INVALID_REFRESH_TOKEN";

type LoginResult =
  | { ok: true; data: AuthSuccessPayload }
  | { ok: false; code: LoginFailureCode };

type RefreshSessionResult =
  | { ok: true; data: AuthSuccessPayload }
  | { ok: false; code: RefreshFailureCode };

type CreatePortalAccountResult =
  | { ok: true; data: { clienteId: number; stato: "INVITATO" } }
  | { ok: false; code: PortalCreateFailureCode };

type ActivatePortalAccountResult =
  | { ok: true; data: { clienteId: number; stato: "ATTIVO" } }
  | { ok: false; code: PortalActivateFailureCode };

type LoginPortalResult =
  | { ok: true; data: PortalAuthSuccessPayload }
  | { ok: false; code: PortalLoginFailureCode };

type RefreshPortalSessionResult =
  | { ok: true; data: PortalAuthSuccessPayload }
  | { ok: false; code: PortalRefreshFailureCode };

type LogoutPortalSessionResult =
  | { ok: true; data: { revoked: true } }
  | { ok: false; code: PortalLogoutFailureCode };

type GetPortalDashboardResult =
  | { ok: true; data: PortalDashboardPayload }
  | { ok: false; code: PortalDashboardFailureCode };

type ListPortalOrdiniResult =
  | { ok: true; data: PortalOrdiniListPayload }
  | { ok: false; code: PortalOrdiniFailureCode };

type GetPortalOrdineDettaglioResult =
  | { ok: true; data: PortalOrdineDettaglioPayload }
  | { ok: false; code: PortalOrdiniFailureCode };

interface CreatePortalAccountInput {
  clienteId: number;
  email: string | null;
}

interface ActivatePortalAccountInput {
  token: string;
  password: string;
}

interface PortalLoginCredentials {
  email: string;
  password: string;
}

interface PortalOrdiniQueryInput {
  page: unknown;
  limit: unknown;
  stato: unknown;
}

type PortalAccountStatus = "INVITATO" | "ATTIVO";
interface PortalAccountRecord {
  clienteId: number;
  email: string;
  status: PortalAccountStatus;
  activationToken: string;
  activationTokenExpiresAt: string;
  passwordHash: string | null;
}

let prismaClient: PrismaClient | null = null;

const baseSeededUsers: AuthUserRecord[] = [
  {
    id: 1,
    username: "mario.rossi",
    email: "mario.rossi@example.com",
    role: "TECNICO",
    isActive: true,
    passwordHash: bcrypt.hashSync("Password1", 12),
  },
  {
    id: 2,
    username: "mario.disabilitato",
    email: "mario.disabilitato@example.com",
    role: "TECNICO",
    isActive: false,
    passwordHash: bcrypt.hashSync("Password1", 12),
  },
];
let seededUsers = cloneAuthUsers(baseSeededUsers);
const basePortalAccounts: PortalAccountRecord[] = [];
let portalAccounts = clonePortalAccounts(basePortalAccounts);
const revokedPortalRefreshTokens = new Map<string, number>();
const PORTAL_USER_ID_PREFIX = 900000;
const PORTAL_REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_KIND = "access" as const;
const REFRESH_KIND = "refresh" as const;
const PORTAL_MAX_EVENTS = 20;
const PORTAL_ORDINI_APERTI_STATI = new Set([
  "IN_LAVORAZIONE",
  "IN_ATTESA_RICAMBI",
]);
const PORTAL_RIPARAZIONI_ATTIVE_STATI = new Set(["IN_LAVORAZIONE"]);
const PORTAL_PREVENTIVI_IN_ATTESA_STATI = new Set(["IN_ATTESA_RICAMBI"]);
const PORTAL_ALLOWED_NOTIFICA_TIPI = new Set([
  "STATO_RIPARAZIONE",
  "PREVENTIVO",
]);

interface DbUserRecord {
  id: number;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  password: string;
}

function mapDbUserToAuthRecord(user: DbUserRecord): AuthUserRecord {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    passwordHash: user.password,
  };
}

async function findUserByUsername(username: string): Promise<AuthUserRecord | undefined> {
  if (process.env.NODE_ENV === "test") {
    return seededUsers.find((record) => record.username === username);
  }

  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  const dbUser = await prismaClient.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      password: true,
    },
  });

  if (!dbUser) {
    return undefined;
  }

  return mapDbUserToAuthRecord(dbUser);
}

async function findUserById(userId: number): Promise<AuthUserRecord | undefined> {
  if (process.env.NODE_ENV === "test") {
    return seededUsers.find((record) => record.id === userId);
  }

  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  const dbUser = await prismaClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      password: true,
    },
  });

  if (!dbUser) {
    return undefined;
  }

  return mapDbUserToAuthRecord(dbUser);
}

function buildAuthSuccessPayload(user: AuthUserRecord): AuthSuccessPayload {
  const tokens = issueAuthTokens({ userId: user.id, role: user.role });

  return {
    ...tokens,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}

function cloneAuthUsers(source: AuthUserRecord[]): AuthUserRecord[] {
  return source.map((user) => ({ ...user }));
}

function clonePortalAccounts(source: PortalAccountRecord[]): PortalAccountRecord[] {
  return source.map((item) => ({ ...item }));
}

function ensureTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("TEST_HELPER_ONLY_IN_TEST_ENV");
  }
}

function resetAuthUsersForTests(): void {
  ensureTestEnvironment();
  seededUsers = cloneAuthUsers(baseSeededUsers);
  portalAccounts = clonePortalAccounts(basePortalAccounts);
  revokedPortalRefreshTokens.clear();
}

function setAuthUserPasswordHashForTests(
  userId: number,
  passwordHash: string,
): void {
  ensureTestEnvironment();
  const targetIndex = seededUsers.findIndex((record) => record.id === userId);
  if (targetIndex === -1) {
    return;
  }

  seededUsers[targetIndex] = {
    ...seededUsers[targetIndex],
    passwordHash,
  };
}

function resetPortalAccountsForTests(): void {
  ensureTestEnvironment();
  portalAccounts = clonePortalAccounts(basePortalAccounts);
  revokedPortalRefreshTokens.clear();
}

async function loginWithCredentials(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  const username = credentials.username.trim();
  const password = credentials.password;

  if (!username || !password) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const user = await findUserByUsername(username);
  if (!user) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  if (!user.isActive) {
    return { ok: false, code: "ACCOUNT_DISABLED" };
  }

  return { ok: true, data: buildAuthSuccessPayload(user) };
}

function resolveTokenPayload(refreshToken: string): JwtPayload | null {
  const verification = verifyAuthToken(refreshToken);
  if (verification.ok) {
    return verification.payload;
  }

  if (verification.code === "JWT_SECRET_MISSING") {
    throw new Error("JWT_SECRET_MISSING");
  }

  return null;
}

async function refreshSession(refreshToken: string): Promise<RefreshSessionResult> {
  const token = refreshToken.trim();
  if (!token) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  const payload = resolveTokenPayload(token);
  if (!payload) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  if (payload.tokenType !== "refresh") {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  if (!user.isActive) {
    return { ok: false, code: "ACCOUNT_DISABLED" };
  }

  return { ok: true, data: buildAuthSuccessPayload(user) };
}

async function createPortalAccountForCliente(
  input: CreatePortalAccountInput,
): Promise<CreatePortalAccountResult> {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!email) {
    return { ok: false, code: "CUSTOMER_EMAIL_REQUIRED" };
  }

  const existing = portalAccounts.find((item) => item.clienteId === input.clienteId);
  if (existing) {
    return { ok: false, code: "PORTAL_ACCOUNT_ALREADY_EXISTS" };
  }

  const activationToken = `portal-${input.clienteId}-token-valid`;
  const activationTokenExpiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ).toISOString();
  const nextRecord: PortalAccountRecord = {
    clienteId: input.clienteId,
    email,
    status: "INVITATO",
    activationToken,
    activationTokenExpiresAt,
    passwordHash: null,
  };

  portalAccounts.push(nextRecord);

  const notification = await createPortalAccountActivationNotifica({
    clienteId: input.clienteId,
    destinatario: email,
  });
  if (notification.stato === "FALLITA") {
    portalAccounts = portalAccounts.filter((item) => item.clienteId !== input.clienteId);
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }

  return {
    ok: true,
    data: {
      clienteId: input.clienteId,
      stato: "INVITATO",
    },
  };
}

async function activatePortalAccount(
  input: ActivatePortalAccountInput,
): Promise<ActivatePortalAccountResult> {
  const token = input.token.trim();
  const password = input.password;
  if (!token) {
    return { ok: false, code: "INVALID_ACTIVATION_TOKEN" };
  }
  if (password.length < 8) {
    return { ok: false, code: "WEAK_PASSWORD" };
  }

  const now = Date.now();
  const targetIndex = portalAccounts.findIndex((item) => item.activationToken === token);
  if (targetIndex === -1) {
    return { ok: false, code: "INVALID_ACTIVATION_TOKEN" };
  }

  const account = portalAccounts[targetIndex];
  const expiresAt = Date.parse(account.activationTokenExpiresAt);
  if (Number.isNaN(expiresAt) || expiresAt < now) {
    return { ok: false, code: "INVALID_ACTIVATION_TOKEN" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  portalAccounts[targetIndex] = {
    ...account,
    status: "ATTIVO",
    passwordHash,
  };

  return {
    ok: true,
    data: {
      clienteId: account.clienteId,
      stato: "ATTIVO",
    },
  };
}

async function loginPortalWithCredentials(
  credentials: PortalLoginCredentials,
): Promise<LoginPortalResult> {
  const email = credentials.email.trim().toLowerCase();
  const password = credentials.password;
  if (!email || !password) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const account = portalAccounts.find((item) => item.email === email);
  if (!account || account.status !== "ATTIVO" || !account.passwordHash) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const isPasswordValid = await bcrypt.compare(password, account.passwordHash);
  if (!isPasswordValid) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const tokens = issueAuthTokens({ userId: 900000 + account.clienteId, role: "COMMERCIALE" });
  return { ok: true, data: tokens };
}

function resolvePortalClienteId(payload: JwtPayload): number | null {
  if (payload.role !== "COMMERCIALE") {
    return null;
  }

  const clienteId = payload.userId - PORTAL_USER_ID_PREFIX;
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    return null;
  }

  return clienteId;
}

function asPositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function cleanupRevokedPortalRefreshTokens(now = Date.now()): void {
  for (const [token, expiresAt] of revokedPortalRefreshTokens.entries()) {
    if (expiresAt <= now) {
      revokedPortalRefreshTokens.delete(token);
    }
  }
}

function resolveRevocationExpiryMs(payload: JwtPayload): number {
  const exp = (payload as JwtPayload & { exp?: number }).exp;
  if (typeof exp === "number" && Number.isFinite(exp)) {
    return exp * 1000;
  }

  return Date.now() + PORTAL_REFRESH_TOKEN_TTL_MS;
}

function isPortalRefreshTokenRevoked(token: string): boolean {
  cleanupRevokedPortalRefreshTokens();
  return revokedPortalRefreshTokens.has(token);
}

function markPortalRefreshTokenRevoked(token: string, payload: JwtPayload): void {
  cleanupRevokedPortalRefreshTokens();
  revokedPortalRefreshTokens.set(token, resolveRevocationExpiryMs(payload));
}

async function findPortalAccountByClienteId(
  clienteId: number,
): Promise<PortalAccountRecord | undefined> {
  return portalAccounts.find((item) => item.clienteId === clienteId);
}

async function buildPortalProfileSummary(clienteId: number): Promise<{
  clienteId: number;
  codiceCliente: string;
  ragioneSociale: string;
}> {
  const fallback = {
    clienteId,
    codiceCliente: `CLI-${String(clienteId).padStart(6, "0")}`,
    ragioneSociale: `Cliente ${clienteId}`,
  };

  try {
    const clienteResult = await getClienteById({ clienteId });
    if (!clienteResult.ok) {
      return fallback;
    }

    const detail = clienteResult.data.data;
    const ragioneSociale = detail.ragioneSociale ?? detail.nome;
    return {
      clienteId,
      codiceCliente: detail.codiceCliente,
      ragioneSociale,
    };
  } catch {
    return fallback;
  }
}

async function refreshPortalSession(
  refreshToken: string,
): Promise<RefreshPortalSessionResult> {
  const token = refreshToken.trim();
  if (!token) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  if (isPortalRefreshTokenRevoked(token)) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  const payload = resolveTokenPayload(token);
  if (!payload || payload.tokenType !== REFRESH_KIND) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  const clienteId = resolvePortalClienteId(payload);
  if (!clienteId) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  const account = await findPortalAccountByClienteId(clienteId);
  if (!account) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  if (account.status !== "ATTIVO" || !account.passwordHash) {
    return { ok: false, code: "ACCOUNT_DISABLED" };
  }

  markPortalRefreshTokenRevoked(token, payload);
  const tokens = issueAuthTokens({
    userId: PORTAL_USER_ID_PREFIX + account.clienteId,
    role: "COMMERCIALE",
  });
  const profileSummary = await buildPortalProfileSummary(account.clienteId);

  return {
    ok: true,
    data: {
      ...tokens,
      profileSummary,
    },
  };
}

async function logoutPortalSession(
  refreshToken: string,
): Promise<LogoutPortalSessionResult> {
  const token = refreshToken.trim();
  if (!token) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  if (isPortalRefreshTokenRevoked(token)) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  const payload = resolveTokenPayload(token);
  if (!payload || payload.tokenType !== REFRESH_KIND) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  const clienteId = resolvePortalClienteId(payload);
  if (!clienteId) {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  const account = await findPortalAccountByClienteId(clienteId);
  if (!account || account.status !== "ATTIVO") {
    return { ok: false, code: "INVALID_REFRESH_TOKEN" };
  }

  markPortalRefreshTokenRevoked(token, payload);

  return { ok: true, data: { revoked: true } };
}

async function getPortalDashboard(accessToken: string): Promise<GetPortalDashboardResult> {
  const token = accessToken.trim();
  if (!token) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const payload = resolveTokenPayload(token);
  if (!payload || payload.tokenType !== ACCESS_KIND) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const clienteId = resolvePortalClienteId(payload);
  if (!clienteId) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const profileSummary = await buildPortalProfileSummary(clienteId);
  const clienteResult = await getClienteById({ clienteId });
  const clienteEmail =
    clienteResult.ok && typeof clienteResult.data.data.email === "string"
      ? clienteResult.data.data.email.trim().toLowerCase()
      : "";

  const riparazioniResult = await listClienteRiparazioni({ clienteId });
  if (!riparazioniResult.ok) {
    if (riparazioniResult.code === "NOT_FOUND") {
      return { ok: false, code: "UNAUTHORIZED" };
    }
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }

  const riparazioni = riparazioniResult.data.data;
  const stats = {
    ordiniAperti: riparazioni.filter((row) => PORTAL_ORDINI_APERTI_STATI.has(row.stato)).length,
    riparazioniAttive: riparazioni.filter((row) => PORTAL_RIPARAZIONI_ATTIVE_STATI.has(row.stato))
      .length,
    preventiviInAttesa: riparazioni.filter((row) =>
      PORTAL_PREVENTIVI_IN_ATTESA_STATI.has(row.stato)
    ).length,
  };

  const riparazioneEvents: PortalDashboardEventPayload[] = riparazioni.map((row) => ({
    tipo: "STATO_RIPARAZIONE",
    riferimentoId: row.id,
    timestamp: row.dataRicezione,
    descrizione: `Riparazione ${row.codiceRiparazione} in stato ${row.stato}`,
  }));

  let notificaEvents: PortalDashboardEventPayload[] = [];
  const notificheResult = await listNotifiche({ page: 1, limit: PORTAL_MAX_EVENTS });
  if (notificheResult.ok && clienteEmail) {
    notificaEvents = notificheResult.data
      .filter((row) => {
        const destinatario = row.destinatario.trim().toLowerCase();
        return destinatario === clienteEmail && PORTAL_ALLOWED_NOTIFICA_TIPI.has(row.tipo);
      })
      .map((row) => ({
        tipo: row.tipo,
        riferimentoId: row.riferimentoId,
        timestamp: row.dataInvio,
        descrizione: row.contenuto,
      }));
  }

  const sortedEvents = [...riparazioneEvents, ...notificaEvents]
    .sort((left, right) => {
      if (left.timestamp === right.timestamp) {
        return right.riferimentoId - left.riferimentoId;
      }
      return right.timestamp.localeCompare(left.timestamp);
    })
    .slice(0, PORTAL_MAX_EVENTS * 2);
  const uniqueEvents = new Map<string, PortalDashboardEventPayload>();
  for (const event of sortedEvents) {
    const key = `${event.tipo}:${event.riferimentoId}:${event.timestamp}`;
    if (!uniqueEvents.has(key)) {
      uniqueEvents.set(key, event);
    }
  }
  const eventiRecenti = Array.from(uniqueEvents.values()).slice(0, PORTAL_MAX_EVENTS);

  return {
    ok: true,
    data: {
      cliente: {
        id: profileSummary.clienteId,
        codiceCliente: profileSummary.codiceCliente,
        ragioneSociale: profileSummary.ragioneSociale,
      },
      stats,
      eventiRecenti,
    },
  };
}

async function listPortalOrdini(
  accessToken: string,
  query: PortalOrdiniQueryInput,
): Promise<ListPortalOrdiniResult> {
  const token = accessToken.trim();
  if (!token) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const payload = resolveTokenPayload(token);
  if (!payload || payload.tokenType !== ACCESS_KIND) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const clienteId = resolvePortalClienteId(payload);
  if (!clienteId) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const riparazioniResult = await listRiparazioni({
    page: query.page,
    limit: query.limit,
    stato: query.stato,
    clienteId,
    tecnicoId: undefined,
    priorita: undefined,
    dataRicezioneDa: undefined,
    dataRicezioneA: undefined,
    search: undefined,
  });
  if (!riparazioniResult.ok) {
    if (riparazioniResult.code === "VALIDATION_ERROR") {
      return { ok: false, code: "VALIDATION_ERROR" };
    }
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }

  return {
    ok: true,
    data: {
      data: riparazioniResult.data.data.map((row) => ({
        id: row.id,
        codiceOrdine: row.codiceRiparazione,
        stato: row.stato,
        dataOrdine: row.dataRicezione,
        tipoDispositivo: row.tipoDispositivo,
      })),
      meta: riparazioniResult.data.meta,
    },
  };
}

async function getPortalOrdineDettaglio(
  accessToken: string,
  ordineId: unknown,
): Promise<GetPortalOrdineDettaglioResult> {
  const token = accessToken.trim();
  if (!token) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const payload = resolveTokenPayload(token);
  if (!payload || payload.tokenType !== ACCESS_KIND) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const clienteId = resolvePortalClienteId(payload);
  if (!clienteId) {
    return { ok: false, code: "UNAUTHORIZED" };
  }

  const parsedOrdineId = asPositiveInteger(ordineId);
  if (parsedOrdineId === null) {
    return { ok: false, code: "VALIDATION_ERROR" };
  }

  const dettaglioResult = await getRiparazioneDettaglio({
    riparazioneId: parsedOrdineId,
  });
  if (!dettaglioResult.ok) {
    if (dettaglioResult.code === "VALIDATION_ERROR") {
      return { ok: false, code: "VALIDATION_ERROR" };
    }
    if (dettaglioResult.code === "NOT_FOUND") {
      return { ok: false, code: "NOT_FOUND" };
    }
    return { ok: false, code: "SERVICE_UNAVAILABLE" };
  }

  const dettaglio = dettaglioResult.data.data;
  if (dettaglio.cliente.id !== clienteId) {
    return { ok: false, code: "FORBIDDEN" };
  }

  const totalePreventivi = roundCurrency(
    dettaglio.preventivi.reduce((sum, item) => sum + item.totale, 0),
  );
  const totalePagato = 0;
  const saldoResiduo = roundCurrency(totalePreventivi - totalePagato);
  const timeline =
    dettaglio.statiHistory.length > 0
      ? dettaglio.statiHistory.map((item) => ({
          stato: item.stato,
          dataOra: item.dataOra,
        }))
      : [
          {
            stato: dettaglio.stato,
            dataOra: new Date().toISOString(),
          },
        ];

  return {
    ok: true,
    data: {
      id: dettaglio.id,
      stato: dettaglio.stato,
      importi: {
        totalePreventivi,
        totalePagato,
        saldoResiduo,
      },
      timeline,
      documentiCollegati: dettaglio.preventivi.map((item) => ({
        tipo: "PREVENTIVO",
        riferimentoId: item.id,
      })),
    },
  };
}

export {
  activatePortalAccount,
  createPortalAccountForCliente,
  getPortalDashboard,
  getPortalOrdineDettaglio,
  listPortalOrdini,
  loginWithCredentials,
  loginPortalWithCredentials,
  logoutPortalSession,
  refreshSession,
  refreshPortalSession,
  resetAuthUsersForTests,
  resetPortalAccountsForTests,
  setAuthUserPasswordHashForTests,
  type ActivatePortalAccountResult,
  type AuthFailureCode,
  type CreatePortalAccountResult,
  type GetPortalDashboardResult,
  type GetPortalOrdineDettaglioResult,
  type LoginFailureCode,
  type LoginResult,
  type LoginPortalResult,
  type ListPortalOrdiniResult,
  type LogoutPortalSessionResult,
  type PortalActivateFailureCode,
  type PortalCreateFailureCode,
  type PortalOrdiniFailureCode,
  type PortalLoginFailureCode,
  type PortalLogoutFailureCode,
  type PortalRefreshFailureCode,
  type RefreshPortalSessionResult,
  type RefreshFailureCode,
  type RefreshSessionResult,
};
