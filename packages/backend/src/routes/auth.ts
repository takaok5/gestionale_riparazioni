import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { verifyAuthToken } from "../middleware/auth.js";
import {
  activatePortalAccount,
  loginWithCredentials,
  loginPortalWithCredentials,
  logoutPortalSession,
  refreshPortalSession,
  refreshSession,
  type AuthFailureCode,
  type ActivatePortalAccountResult,
  type LoginResult,
  type LoginPortalResult,
  type LogoutPortalSessionResult,
  type RefreshPortalSessionResult,
  type RefreshSessionResult,
} from "../services/auth-service.js";
import {
  clearFailedAttempts,
  clearFailedAttemptsForKey,
  getRetryAfterSeconds,
  getRetryAfterSecondsForKey,
  registerFailedAttempt,
  registerFailedAttemptForKey,
  type RateLimitPolicy,
} from "../services/login-rate-limit.js";

const authRouter = Router();
const portalAuthRouter = Router();
const ACCESS_KIND = "access" as const;

function readBodyString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function resolveClientIp(forwardedFor: string | undefined, fallbackIp: string): string {
  if (!forwardedFor) {
    return fallbackIp;
  }

  const [clientIp] = forwardedFor.split(",");
  return clientIp.trim() || fallbackIp;
}

function getErrorMessage(code: AuthFailureCode): string {
  if (code === "ACCOUNT_DISABLED") {
    return "Account disabilitato";
  }

  if (code === "INVALID_REFRESH_TOKEN") {
    return "Refresh token non valido";
  }

  return "Credenziali non valide";
}

const portalLoginPolicy: RateLimitPolicy = {
  maxFailedAttempts: 10,
  windowMs: 15 * 60 * 1000,
  retryAfterCapSeconds: 15 * 60,
};

function resolvePortalRateLimitKey(ip: string, email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return `${ip}|${normalizedEmail || "unknown-email"}`;
}

function respondAuthServiceError(res: Response, error: unknown): void {
  if (error instanceof Error && error.message === "JWT_SECRET_MISSING") {
    res.status(500).json(
      buildErrorResponse("JWT_SECRET_MISSING", "JWT_SECRET non configurato"),
    );
    return;
  }

  res.status(500).json(
    buildErrorResponse(
      "AUTH_SERVICE_UNAVAILABLE",
      "Servizio autenticazione non disponibile",
    ),
  );
}

function respondPortalActivateFailure(
  res: Response,
  result: Exclude<ActivatePortalAccountResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "INVALID_ACTIVATION_TOKEN") {
    res
      .status(400)
      .json(buildErrorResponse("INVALID_ACTIVATION_TOKEN", "Activation token non valido"));
    return;
  }

  if (result.code === "WEAK_PASSWORD") {
    res
      .status(400)
      .json(buildErrorResponse("WEAK_PASSWORD", "Password troppo debole"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalLoginFailure(
  res: Response,
  result: Exclude<LoginPortalResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "INVALID_CREDENTIALS") {
    res
      .status(401)
      .json(buildErrorResponse("INVALID_CREDENTIALS", "Credenziali non valide"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalRefreshFailure(
  res: Response,
  result: Exclude<RefreshPortalSessionResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "ACCOUNT_DISABLED") {
    res
      .status(401)
      .json(buildErrorResponse("ACCOUNT_DISABLED", "Account disabilitato"));
    return;
  }

  res
    .status(401)
    .json(buildErrorResponse("INVALID_REFRESH_TOKEN", "Refresh token non valido"));
}

function respondPortalLogoutFailure(
  res: Response,
  _result: Exclude<LogoutPortalSessionResult, { ok: true; data: unknown }>,
): void {
  res
    .status(401)
    .json(buildErrorResponse("INVALID_REFRESH_TOKEN", "Refresh token non valido"));
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
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    registerFailedAttempt(ip);
    res.status(401).json(buildErrorResponse(result.code, getErrorMessage(result.code)));
    return;
  }

  clearFailedAttempts(ip);
  res.status(200).json(result.data);
});

authRouter.post("/refresh", async (req, res) => {
  const refreshInput = readBodyString(req.body?.refreshToken);

  let result: RefreshSessionResult;
  try {
    result = await refreshSession(refreshInput);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    res.status(401).json(buildErrorResponse(result.code, getErrorMessage(result.code)));
    return;
  }

  res.status(200).json(result.data);
});

portalAuthRouter.post("/activate", async (req, res) => {
  const payload = {
    token: readBodyString(req.body?.token),
    password: readBodyString(req.body?.password),
  };

  let result: ActivatePortalAccountResult;
  try {
    result = await activatePortalAccount(payload);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalActivateFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

portalAuthRouter.post("/login", async (req, res) => {
  const ip = resolveClientIp(req.header("x-forwarded-for"), req.ip || "0.0.0.0");
  const payload = {
    email: readBodyString(req.body?.email),
    password: readBodyString(req.body?.password),
  };
  const rateLimitKey = resolvePortalRateLimitKey(ip, payload.email);
  const retryAfter = getRetryAfterSecondsForKey(rateLimitKey, portalLoginPolicy);
  if (retryAfter !== null) {
    res.setHeader("Retry-After", String(retryAfter));
    res
      .status(423)
      .json(
        buildErrorResponse(
          "ACCOUNT_TEMPORARILY_LOCKED",
          "Account temporaneamente bloccato per troppi tentativi falliti",
        ),
      );
    return;
  }

  let result: LoginPortalResult;
  try {
    result = await loginPortalWithCredentials(payload);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    if (result.code === "INVALID_CREDENTIALS") {
      registerFailedAttemptForKey(rateLimitKey, portalLoginPolicy);
    }
    respondPortalLoginFailure(res, result);
    return;
  }

  clearFailedAttemptsForKey(rateLimitKey);
  res.status(200).json(result.data);
});

portalAuthRouter.post("/refresh", async (req, res) => {
  const refreshInput = readBodyString(req.body?.refreshToken);

  let result: RefreshPortalSessionResult;
  try {
    result = await refreshPortalSession(refreshInput);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalRefreshFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

portalAuthRouter.post("/logout", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }
  const bearerPrefixLength = "Bearer ".length;
  const accessJwt = authHeader.slice(bearerPrefixLength);
  const verification = verifyAuthToken(accessJwt);
  if (!verification.ok || verification.payload.tokenType !== ACCESS_KIND) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const refreshInput = readBodyString(req.body?.refreshToken);

  let result: LogoutPortalSessionResult;
  try {
    result = await logoutPortalSession(refreshInput);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalLogoutFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

export { authRouter, portalAuthRouter };
