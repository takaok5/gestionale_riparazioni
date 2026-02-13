import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  issueAuthTokens,
  verifyAuthToken,
  type JwtPayload,
} from "../middleware/auth.js";
import { getClienteById } from "./anagrafiche-service.js";
import { createPortalAccountActivationNotifica } from "./notifiche-service.js";

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
  profileSummary: {
    clienteId: number;
    codiceCliente: string;
    ragioneSociale: string;
  };
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
  if (!payload || payload.tokenType !== "refresh") {
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
  if (!payload || payload.tokenType !== "refresh") {
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

export {
  activatePortalAccount,
  createPortalAccountForCliente,
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
  type LoginFailureCode,
  type LoginResult,
  type LoginPortalResult,
  type LogoutPortalSessionResult,
  type PortalActivateFailureCode,
  type PortalCreateFailureCode,
  type PortalLoginFailureCode,
  type PortalLogoutFailureCode,
  type PortalRefreshFailureCode,
  type RefreshPortalSessionResult,
  type RefreshFailureCode,
  type RefreshSessionResult,
};
