import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import {
  activatePortalAccount,
  loginWithCredentials,
  loginPortalWithCredentials,
  refreshSession,
  type AuthFailureCode,
  type ActivatePortalAccountResult,
  type LoginResult,
  type LoginPortalResult,
  type RefreshSessionResult,
} from "../services/auth-service.js";
import {
  clearFailedAttempts,
  getRetryAfterSeconds,
  registerFailedAttempt,
} from "../services/login-rate-limit.js";

const authRouter = Router();
const portalAuthRouter = Router();

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
  const refreshToken =
    typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";

  let result: RefreshSessionResult;
  try {
    result = await refreshSession(refreshToken);
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
    token: typeof req.body?.token === "string" ? req.body.token : "",
    password: typeof req.body?.password === "string" ? req.body.password : "",
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
  const payload = {
    email: typeof req.body?.email === "string" ? req.body.email : "",
    password: typeof req.body?.password === "string" ? req.body.password : "",
  };

  let result: LoginPortalResult;
  try {
    result = await loginPortalWithCredentials(payload);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalLoginFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

export { authRouter, portalAuthRouter };
