import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

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

  try {
    const secret = resolveJwtSecret();
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error && error.message === "JWT_SECRET_MISSING") {
      res.status(500).json({
        error: {
          code: "JWT_SECRET_MISSING",
          message: "JWT_SECRET non configurato",
        },
      });
      return;
    }

    res.status(401).json({ error: "Token non valido" });
  }
}

function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Non autenticato" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Accesso negato" });
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

function issueAuthTokens(payload: JwtPayload): AuthTokens {
  const secret = resolveJwtSecret();

  return {
    accessToken: jwt.sign(payload, secret, { expiresIn: "15m" }),
    refreshToken: jwt.sign(payload, secret, { expiresIn: "7d" }),
  };
}

export { authenticate, authorize, issueAuthTokens, type JwtPayload, type AuthTokens };
