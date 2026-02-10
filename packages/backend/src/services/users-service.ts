import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

interface CreateUserInput {
  username: unknown;
  email: unknown;
  password: unknown;
  role: unknown;
}

interface CreatedUserPayload {
  id: number;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
}

interface ValidationDetails extends Record<string, unknown> {
  field: string;
  rule: string;
  min?: number;
  values?: Role[];
}

interface TestUserRecord extends CreatedUserPayload {
  passwordHash: string;
}

type CreateUserValidationFailure = {
  ok: false;
  code: "VALIDATION_ERROR";
  details: ValidationDetails;
};

type CreateUserResult =
  | { ok: true; data: CreatedUserPayload }
  | { ok: false; code: "USERNAME_EXISTS" }
  | { ok: false; code: "EMAIL_EXISTS" }
  | CreateUserValidationFailure;

const ALLOWED_ROLES: Role[] = ["ADMIN", "TECNICO", "COMMERCIALE"];
const TEST_BCRYPT_ROUNDS = 4;
const PROD_BCRYPT_ROUNDS = 12;

const baseTestUsers: TestUserRecord[] = [
  {
    id: 1,
    username: "mario.rossi",
    email: "mario.rossi@example.com",
    role: "TECNICO",
    isActive: true,
    passwordHash: bcrypt.hashSync("Password1", TEST_BCRYPT_ROUNDS),
  },
  {
    id: 2,
    username: "mario.disabilitato",
    email: "mario.disabilitato@example.com",
    role: "TECNICO",
    isActive: false,
    passwordHash: bcrypt.hashSync("Password1", TEST_BCRYPT_ROUNDS),
  },
];

let testUsers = cloneTestUsers(baseTestUsers);
let nextTestUserId = computeNextUserId(testUsers);
let prismaClient: PrismaClient | null = null;

function cloneTestUsers(source: TestUserRecord[]): TestUserRecord[] {
  return source.map((user) => ({ ...user }));
}

function computeNextUserId(users: TestUserRecord[]): number {
  const highestId = users.reduce((max, user) => Math.max(max, user.id), 0);
  return highestId + 1;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildValidationFailure(details: ValidationDetails): CreateUserValidationFailure {
  return {
    ok: false,
    code: "VALIDATION_ERROR",
    details,
  };
}

function parseCreateUserInput(
  input: CreateUserInput,
):
  | {
      ok: true;
      data: {
        username: string;
        email: string;
        password: string;
        role: Role;
      };
    }
  | CreateUserValidationFailure {
  const username = asNonEmptyString(input.username);
  if (!username) {
    return buildValidationFailure({ field: "username", rule: "required" });
  }

  const email = asNonEmptyString(input.email);
  if (!email || !isValidEmail(email)) {
    return buildValidationFailure({ field: "email", rule: "invalid_format" });
  }

  const password = asNonEmptyString(input.password);
  if (!password) {
    return buildValidationFailure({ field: "password", rule: "required" });
  }

  if (password.length < 8) {
    return buildValidationFailure({
      field: "password",
      rule: "min_length",
      min: 8,
    });
  }

  if (typeof input.role !== "string" || !ALLOWED_ROLES.includes(input.role as Role)) {
    return buildValidationFailure({
      field: "role",
      rule: "invalid_enum",
      values: ALLOWED_ROLES,
    });
  }

  return {
    ok: true,
    data: {
      username,
      email: email.toLowerCase(),
      password,
      role: input.role as Role,
    },
  };
}

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

function mapToCreatedUserPayload(record: TestUserRecord): CreatedUserPayload {
  return {
    id: record.id,
    username: record.username,
    email: record.email,
    role: record.role,
    isActive: record.isActive,
  };
}

async function createUserInTestStore(payload: {
  username: string;
  email: string;
  password: string;
  role: Role;
}): Promise<CreateUserResult> {
  const existing = testUsers.find((user) => user.username === payload.username);
  if (existing) {
    return { ok: false, code: "USERNAME_EXISTS" };
  }

  const existingEmail = testUsers.find((user) => user.email === payload.email);
  if (existingEmail) {
    return { ok: false, code: "EMAIL_EXISTS" };
  }

  const passwordHash = await bcrypt.hash(payload.password, TEST_BCRYPT_ROUNDS);
  const createdUser: TestUserRecord = {
    id: nextTestUserId,
    username: payload.username,
    email: payload.email,
    role: payload.role,
    isActive: true,
    passwordHash,
  };

  nextTestUserId += 1;
  testUsers.push(createdUser);

  return {
    ok: true,
    data: mapToCreatedUserPayload(createdUser),
  };
}

async function createUserInDatabase(payload: {
  username: string;
  email: string;
  password: string;
  role: Role;
}): Promise<CreateUserResult> {
  const passwordHash = await bcrypt.hash(payload.password, PROD_BCRYPT_ROUNDS);

  try {
    const created = await getPrismaClient().user.create({
      data: {
        username: payload.username,
        email: payload.email,
        password: passwordHash,
        role: payload.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return {
      ok: true,
      data: created,
    };
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
      if (target.includes("username")) {
        return { ok: false, code: "USERNAME_EXISTS" };
      }
      if (target.includes("email")) {
        return { ok: false, code: "EMAIL_EXISTS" };
      }
    }

    throw error;
  }
}

async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const parsed = parseCreateUserInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return createUserInTestStore(parsed.data);
  }

  return createUserInDatabase(parsed.data);
}

function resetUsersStoreForTests(): void {
  testUsers = cloneTestUsers(baseTestUsers);
  nextTestUserId = computeNextUserId(testUsers);
}

export { createUser, resetUsersStoreForTests, type CreateUserInput, type CreateUserResult };
