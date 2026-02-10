import { Router } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import {
  loginWithCredentials,
  type LoginFailureCode,
  type LoginResult,
} from "../services/auth-service.js";
import {
  clearFailedAttempts,
  getRetryAfterSeconds,
  registerFailedAttempt,
} from "../services/login-rate-limit.js";

const authRouter = Router();

function resolveClientIp(forwardedFor: string | undefined, fallbackIp: string): string {
  if (!forwardedFor) {
    return fallbackIp;
  }

  const [clientIp] = forwardedFor.split(",");
  return clientIp.trim() || fallbackIp;
}

function getErrorMessage(code: LoginFailureCode): string {
  if (code === "ACCOUNT_DISABLED") {
    return "Account disabilitato";
  }

  return "Credenziali non valide";
}

authRouter.post("/login", async (req, res) => {
  const ip = resolveClientIp(req.header("x-forwarded-for"), req.ip || "0.0.0.0");
  const retryAfter = getRetryAfterSeconds(ip);
  if (retryAfter !== null) {
    res.setHeader("retryAfter", String(retryAfter));
    res.status(429).json(
      buildErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Troppi tentativi di login falliti",
        { retryAfter },
      ),
    );
    return;
  }

  const credentials = {
    username: typeof req.body?.username === "string" ? req.body.username : "",
    password: typeof req.body?.password === "string" ? req.body.password : "",
  };

  let result: LoginResult;
  try {
    result = await loginWithCredentials(credentials);
  } catch {
    res.status(500).json(
      buildErrorResponse(
        "AUTH_SERVICE_UNAVAILABLE",
        "Servizio autenticazione non disponibile",
      ),
    );
    return;
  }

  if (!result.ok) {
    registerFailedAttempt(ip);
    res
      .status(401)
      .json(buildErrorResponse(result.code, getErrorMessage(result.code)));
    return;
  }

  clearFailedAttempts(ip);
  res.status(200).json(result.data);
});

export { authRouter };
