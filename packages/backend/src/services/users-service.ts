import bcrypt from "bcryptjs";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  resetAuthUsersForTests,
  setAuthUserPasswordHashForTests,
} from "./auth-service.js";

type Role = "ADMIN" | "TECNICO" | "COMMERCIALE";

interface CreateUserInput {
  username: unknown;
  email: unknown;
  password: unknown;
  role: unknown;
}

interface UpdateUserRoleInput {
  userId: unknown;
  role: unknown;
}

interface DeactivateUserInput {
  userId: unknown;
}

interface ChangeOwnPasswordInput {
  userId: unknown;
  currentPassword: unknown;
  newPassword: unknown;
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

type ValidationFailure = {
  ok: false;
  code: "VALIDATION_ERROR";
  details: ValidationDetails;
};

type UserNotFoundFailure = {
  ok: false;
  code: "USER_NOT_FOUND";
};

type LastAdminDeactivationFailure = {
  ok: false;
  code: "LAST_ADMIN_DEACTIVATION_FORBIDDEN";
};

type CurrentPasswordIncorrectFailure = {
  ok: false;
  code: "CURRENT_PASSWORD_INCORRECT";
};

type CreateUserResult =
  | { ok: true; data: CreatedUserPayload }
  | { ok: false; code: "USERNAME_EXISTS" }
  | { ok: false; code: "EMAIL_EXISTS" }
  | ValidationFailure;

type UpdateUserRoleResult =
  | { ok: true; data: CreatedUserPayload }
  | ValidationFailure
  | UserNotFoundFailure;

type DeactivateUserResult =
  | { ok: true; data: CreatedUserPayload }
  | ValidationFailure
  | UserNotFoundFailure
  | LastAdminDeactivationFailure;

type ChangeOwnPasswordResult =
  | { ok: true }
  | ValidationFailure
  | UserNotFoundFailure
  | CurrentPasswordIncorrectFailure;

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

function asPositiveInteger(value: unknown): number | null {
  if (typeof value === "number") {
    if (Number.isInteger(value) && value > 0) {
      return value;
    }

    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function countActiveAdmins(users: TestUserRecord[]): number {
  return users.filter((user) => user.role === "ADMIN" && user.isActive).length;
}

function buildValidationFailure(details: ValidationDetails): ValidationFailure {
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
  | ValidationFailure {
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

function parseUpdateUserRoleInput(
  input: UpdateUserRoleInput,
):
  | {
      ok: true;
      data: {
        userId: number;
        role: Role;
      };
    }
  | ValidationFailure {
  const userId = asPositiveInteger(input.userId);
  if (userId === null) {
    return buildValidationFailure({
      field: "userId",
      rule: "invalid_integer",
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
      userId,
      role: input.role as Role,
    },
  };
}

function parseDeactivateUserInput(
  input: DeactivateUserInput,
): { ok: true; data: { userId: number } } | ValidationFailure {
  const userId = asPositiveInteger(input.userId);
  if (userId === null) {
    return buildValidationFailure({
      field: "userId",
      rule: "invalid_integer",
    });
  }

  return {
    ok: true,
    data: {
      userId,
    },
  };
}

function matchesPasswordPolicy(value: string): boolean {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

function parseChangeOwnPasswordInput(
  input: ChangeOwnPasswordInput,
):
  | {
      ok: true;
      data: {
        userId: number;
        currentPassword: string;
        newPassword: string;
      };
    }
  | ValidationFailure {
  const userId = asPositiveInteger(input.userId);
  if (userId === null) {
    return buildValidationFailure({
      field: "userId",
      rule: "invalid_integer",
    });
  }

  const currentPassword = asNonEmptyString(input.currentPassword);
  if (!currentPassword) {
    return buildValidationFailure({
      field: "currentPassword",
      rule: "required",
    });
  }

  const newPassword = asNonEmptyString(input.newPassword);
  if (!newPassword || !matchesPasswordPolicy(newPassword)) {
    return buildValidationFailure({
      field: "newPassword",
      rule: "password_policy",
      min: 8,
      requiresUppercase: true,
      requiresNumber: true,
    });
  }

  return {
    ok: true,
    data: {
      userId,
      currentPassword,
      newPassword,
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

async function updateUserRoleInTestStore(payload: {
  userId: number;
  role: Role;
}): Promise<UpdateUserRoleResult> {
  const targetIndex = testUsers.findIndex((user) => user.id === payload.userId);
  if (targetIndex === -1) {
    return { ok: false, code: "USER_NOT_FOUND" };
  }

  const updatedRecord: TestUserRecord = {
    ...testUsers[targetIndex],
    role: payload.role,
  };

  testUsers[targetIndex] = updatedRecord;

  return {
    ok: true,
    data: mapToCreatedUserPayload(updatedRecord),
  };
}

async function updateUserRoleInDatabase(payload: {
  userId: number;
  role: Role;
}): Promise<UpdateUserRoleResult> {
  try {
    const updated = await getPrismaClient().user.update({
      where: { id: payload.userId },
      data: { role: payload.role },
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
      data: updated,
    };
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, code: "USER_NOT_FOUND" };
    }

    throw error;
  }
}

async function deactivateUserInTestStore(payload: {
  userId: number;
}): Promise<DeactivateUserResult> {
  const targetIndex = testUsers.findIndex((user) => user.id === payload.userId);
  if (targetIndex === -1) {
    return { ok: false, code: "USER_NOT_FOUND" };
  }

  const targetUser = testUsers[targetIndex];

  if (
    targetUser.role === "ADMIN" &&
    targetUser.isActive &&
    countActiveAdmins(testUsers) <= 1
  ) {
    return { ok: false, code: "LAST_ADMIN_DEACTIVATION_FORBIDDEN" };
  }

  const updatedRecord: TestUserRecord = {
    ...targetUser,
    isActive: false,
  };

  testUsers[targetIndex] = updatedRecord;

  return {
    ok: true,
    data: mapToCreatedUserPayload(updatedRecord),
  };
}

async function deactivateUserInDatabase(payload: {
  userId: number;
}): Promise<DeactivateUserResult> {
  return getPrismaClient().$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!existing) {
      return { ok: false, code: "USER_NOT_FOUND" } as const;
    }

    if (existing.role === "ADMIN" && existing.isActive) {
      const activeAdminCount = await tx.user.count({
        where: {
          role: "ADMIN",
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return {
          ok: false,
          code: "LAST_ADMIN_DEACTIVATION_FORBIDDEN",
        } as const;
      }
    }

    const updated = await tx.user.update({
      where: { id: payload.userId },
      data: { isActive: false },
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
      data: updated,
    } as const;
  });
}

async function changeOwnPasswordInTestStore(payload: {
  userId: number;
  currentPassword: string;
  newPassword: string;
}): Promise<ChangeOwnPasswordResult> {
  const targetIndex = testUsers.findIndex((user) => user.id === payload.userId);
  if (targetIndex === -1) {
    return { ok: false, code: "USER_NOT_FOUND" };
  }

  const targetUser = testUsers[targetIndex];
  const isCurrentPasswordValid = await bcrypt.compare(
    payload.currentPassword,
    targetUser.passwordHash,
  );
  if (!isCurrentPasswordValid) {
    return { ok: false, code: "CURRENT_PASSWORD_INCORRECT" };
  }

  const nextPasswordHash = await bcrypt.hash(
    payload.newPassword,
    TEST_BCRYPT_ROUNDS,
  );
  testUsers[targetIndex] = {
    ...targetUser,
    passwordHash: nextPasswordHash,
  };
  setAuthUserPasswordHashForTests(payload.userId, nextPasswordHash);

  return { ok: true };
}

async function changeOwnPasswordInDatabase(payload: {
  userId: number;
  currentPassword: string;
  newPassword: string;
}): Promise<ChangeOwnPasswordResult> {
  return getPrismaClient().$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!existing) {
      return { ok: false, code: "USER_NOT_FOUND" } as const;
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      payload.currentPassword,
      existing.password,
    );
    if (!isCurrentPasswordValid) {
      return { ok: false, code: "CURRENT_PASSWORD_INCORRECT" } as const;
    }

    const nextPasswordHash = await bcrypt.hash(
      payload.newPassword,
      PROD_BCRYPT_ROUNDS,
    );
    await tx.user.update({
      where: { id: payload.userId },
      data: {
        password: nextPasswordHash,
      },
    });

    return { ok: true } as const;
  });
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

async function updateUserRole(
  input: UpdateUserRoleInput,
): Promise<UpdateUserRoleResult> {
  const parsed = parseUpdateUserRoleInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return updateUserRoleInTestStore(parsed.data);
  }

  return updateUserRoleInDatabase(parsed.data);
}

async function deactivateUser(
  input: DeactivateUserInput,
): Promise<DeactivateUserResult> {
  const parsed = parseDeactivateUserInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return deactivateUserInTestStore(parsed.data);
  }

  return deactivateUserInDatabase(parsed.data);
}

async function changeOwnPassword(
  input: ChangeOwnPasswordInput,
): Promise<ChangeOwnPasswordResult> {
  const parsed = parseChangeOwnPasswordInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  if (process.env.NODE_ENV === "test") {
    return changeOwnPasswordInTestStore(parsed.data);
  }

  return changeOwnPasswordInDatabase(parsed.data);
}

function resetUsersStoreForTests(): void {
  ensureTestEnvironment();
  testUsers = cloneTestUsers(baseTestUsers);
  nextTestUserId = computeNextUserId(testUsers);
  resetAuthUsersForTests();
}

function setUserRoleForTests(userId: number, role: Role): void {
  ensureTestEnvironment();
  const targetIndex = testUsers.findIndex((user) => user.id === userId);
  if (targetIndex === -1) {
    return;
  }

  testUsers[targetIndex] = {
    ...testUsers[targetIndex],
    role,
  };
}

function setUserIsActiveForTests(userId: number, isActive: boolean): void {
  ensureTestEnvironment();
  const targetIndex = testUsers.findIndex((user) => user.id === userId);
  if (targetIndex === -1) {
    return;
  }

  testUsers[targetIndex] = {
    ...testUsers[targetIndex],
    isActive,
  };
}

function getUserRoleForTests(userId: number): Role | null {
  ensureTestEnvironment();
  const user = testUsers.find((record) => record.id === userId);
  if (!user || !user.isActive) {
    return null;
  }

  return user.role;
}

function ensureTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("TEST_HELPER_ONLY_IN_TEST_ENV");
  }
}

export {
  createUser,
  updateUserRole,
  deactivateUser,
  changeOwnPassword,
  resetUsersStoreForTests,
  setUserRoleForTests,
  setUserIsActiveForTests,
  getUserRoleForTests,
  type CreateUserInput,
  type CreateUserResult,
  type UpdateUserRoleInput,
  type UpdateUserRoleResult,
  type DeactivateUserInput,
  type DeactivateUserResult,
  type ChangeOwnPasswordInput,
  type ChangeOwnPasswordResult,
};
