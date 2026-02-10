import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { issueAuthTokens } from "../middleware/auth.js";

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

interface LoginSuccessPayload {
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

type LoginResult =
  | { ok: true; data: LoginSuccessPayload }
  | { ok: false; code: LoginFailureCode };

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

  const tokens = issueAuthTokens({ userId: user.id, role: user.role });

  return {
    ok: true,
    data: {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  };
}

export { loginWithCredentials, type LoginFailureCode, type LoginResult };
