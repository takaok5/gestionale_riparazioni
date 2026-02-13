import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { buildErrorResponse } from "../lib/errors.js";

interface JwtPayload {
  userId: number;
  role: string;
  tokenType: "access" | "refresh";
}

interface TokenSubject {
  userId: number;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

type VerifyTokenResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; code: "INVALID_TOKEN" | "JWT_SECRET_MISSING" };
type AuthorizeOption = { forbiddenMessage?: string };

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token mancante" });
    return;
  }

  const token = authHeader.slice(7);
  const verification = verifyAuthToken(token);
  if (!verification.ok) {
    if (verification.code === "JWT_SECRET_MISSING") {
      res.status(500).json({
        error: {
          code: "JWT_SECRET_MISSING",
          message: "JWT_SECRET non configurato",
        },
      });
      return;
    }

    res.status(401).json({ error: "Token non valido" });
    return;
  }

  req.user = verification.payload;
  if (req.user.tokenType !== "access") {
    res.status(401).json({ error: "Token non valido" });
    return;
  }

  next();
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as { userId?: unknown; role?: unknown };
  return (
    typeof payload.userId === "number" &&
    Number.isInteger(payload.userId) &&
    typeof payload.role === "string" &&
    payload.role.length > 0 &&
    (payload as { tokenType?: unknown }).tokenType !== undefined &&
    ((payload as { tokenType?: unknown }).tokenType === "access" ||
      (payload as { tokenType?: unknown }).tokenType === "refresh")
  );
}

function verifyAuthToken(token: string): VerifyTokenResult {
  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, code: "INVALID_TOKEN" };
  }

  try {
    const secret = resolveJwtSecret();
    const decoded = jwt.verify(trimmed, secret);
    if (!isJwtPayload(decoded)) {
      return { ok: false, code: "INVALID_TOKEN" };
    }

    return { ok: true, payload: decoded };
  } catch (error) {
    if (error instanceof Error && error.message === "JWT_SECRET_MISSING") {
      return { ok: false, code: "JWT_SECRET_MISSING" };
    }

    return { ok: false, code: "INVALID_TOKEN" };
  }
}

function authorize(...rolesOrOptions: Array<string | AuthorizeOption>) {
  const roles: string[] = [];
  let forbiddenMessage = "Accesso negato";

  for (const value of rolesOrOptions) {
    if (typeof value === "string") {
      roles.push(value);
      continue;
    }

    if (typeof value.forbiddenMessage === "string" && value.forbiddenMessage.trim().length > 0) {
      forbiddenMessage = value.forbiddenMessage.trim();
    }
  }
  if (roles.length === 0) {
    throw new Error("AUTHORIZE_ROLES_REQUIRED");
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Non autenticato" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json(buildErrorResponse("FORBIDDEN", forbiddenMessage));
      return;
    }
    next();
  };
}

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === "test") {
    return "test-jwt-secret";
  }

  throw new Error("JWT_SECRET_MISSING");
}

function issueAuthTokens(payload: TokenSubject): AuthTokens {
  const secret = resolveJwtSecret();
  const accessPayload: JwtPayload = { ...payload, tokenType: "access" };
  const refreshPayload: JwtPayload = { ...payload, tokenType: "refresh" };

  return {
    accessToken: jwt.sign(accessPayload, secret, { expiresIn: "15m" }),
    refreshToken: jwt.sign(refreshPayload, secret, { expiresIn: "7d" }),
  };
}

export {
  authenticate,
  authorize,
  issueAuthTokens,
  verifyAuthToken,
  type JwtPayload,
  type AuthTokens,
  type VerifyTokenResult,
};
