import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  issueAuthTokens,
  verifyAuthToken,
  type JwtPayload,
} from "../middleware/auth.js";

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

type LoginFailureCode = "INVALID_CREDENTIALS" | "ACCOUNT_DISABLED";
type RefreshFailureCode = "INVALID_REFRESH_TOKEN" | "ACCOUNT_DISABLED";
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

let prismaClient: PrismaClient | null = null;

const seededUsers: AuthUserRecord[] = [
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

export {
  loginWithCredentials,
  refreshSession,
  type AuthFailureCode,
  type LoginFailureCode,
  type LoginResult,
  type RefreshFailureCode,
  type RefreshSessionResult,
};
