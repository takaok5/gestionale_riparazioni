import { Router, type RequestHandler, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { verifyAuthToken } from "../middleware/auth.js";
import { getClienteById } from "../services/anagrafiche-service.js";
import {
  activatePortalAccount,
  getPortalDashboard,
  getPortalFatturaPdf,
  getPortalOrdineDettaglio,
  getPortalPreventivoPdf,
  getPortalRiparazioneDettaglio,
  listPortalOrdini,
  listPortalRiparazioni,
  loginWithCredentials,
  loginPortalWithCredentials,
  registraRispostaPreventivoPortale,
  logoutPortalSession,
  refreshPortalSession,
  refreshSession,
  type AuthFailureCode,
  type ActivatePortalAccountResult,
  type GetPortalDashboardResult,
  type GetPortalFatturaPdfResult,
  type GetPortalOrdineDettaglioResult,
  type GetPortalPreventivoPdfResult,
  type GetPortalRiparazioneDettaglioResult,
  type LoginResult,
  type LoginPortalResult,
  type ListPortalOrdiniResult,
  type ListPortalRiparazioniResult,
  type LogoutPortalSessionResult,
  type RegistraPortalPreventivoRispostaResult,
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
const portalRouter = Router();
const ACCESS_KIND = "access" as const;
const PORTAL_USER_ID_PREFIX = 900000;

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

async function buildPortalProfileSummaryFromAccessToken(accessToken: string): Promise<{
  clienteId: number;
  codiceCliente: string;
  ragioneSociale: string;
}> {
  const verification = verifyAuthToken(accessToken);
  if (
    !verification.ok
    || verification.payload.role !== "COMMERCIALE"
    || verification.payload.tokenType !== ACCESS_KIND
  ) {
    throw new Error("INVALID_PORTAL_ACCESS_TOKEN");
  }

  const clienteId = verification.payload.userId - PORTAL_USER_ID_PREFIX;
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new Error("INVALID_PORTAL_ACCESS_TOKEN");
  }

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
    return {
      clienteId,
      codiceCliente: detail.codiceCliente,
      ragioneSociale: detail.ragioneSociale ?? detail.nome,
    };
  } catch {
    return fallback;
  }
}

const portalLoginRateLimitGuard: RequestHandler = (req, res, next) => {
  const ip = resolveClientIp(req.header("x-forwarded-for"), req.ip || "0.0.0.0");
  const emailInput = readBodyString(req.body?.email);
  const rateLimitKey = resolvePortalRateLimitKey(ip, emailInput);
  res.locals.portalRateLimitKey = rateLimitKey;

  const retryAfter = getRetryAfterSecondsForKey(rateLimitKey, portalLoginPolicy);
  if (retryAfter === null) {
    next();
    return;
  }

  res.setHeader("Retry-After", String(retryAfter));
  res
    .status(423)
    .json(
      buildErrorResponse(
        "ACCOUNT_TEMPORARILY_LOCKED",
        "Account temporaneamente bloccato per troppi tentativi falliti",
      ),
    );
};

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

function respondPortalDashboardFailure(
  res: Response,
  result: Exclude<GetPortalDashboardResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "UNAUTHORIZED") {
    res
      .status(401)
      .json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalOrdiniListFailure(
  res: Response,
  result: Exclude<ListPortalOrdiniResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "UNAUTHORIZED") {
    res
      .status(401)
      .json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", "Parametri non validi"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalRiparazioniListFailure(
  res: Response,
  result: Exclude<ListPortalRiparazioniResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "UNAUTHORIZED") {
    res
      .status(401)
      .json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", "Parametri non validi"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalOrdineDettaglioFailure(
  res: Response,
  result: Exclude<GetPortalOrdineDettaglioResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "UNAUTHORIZED") {
    res
      .status(401)
      .json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", "Parametri non validi"));
    return;
  }

  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", "FORBIDDEN"));
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("ORDINE_NOT_FOUND", "Ordine non trovato"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalRiparazioneDettaglioFailure(
  res: Response,
  result: Exclude<GetPortalRiparazioneDettaglioResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "UNAUTHORIZED") {
    res
      .status(401)
      .json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", "Parametri non validi"));
    return;
  }

  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", "FORBIDDEN"));
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("RIPARAZIONE_NOT_FOUND", "Riparazione non trovata"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalPreventivoRispostaFailure(
  res: Response,
  result: Exclude<RegistraPortalPreventivoRispostaResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "UNAUTHORIZED") {
    res
      .status(401)
      .json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", "Payload non valido"));
    return;
  }

  if (result.code === "RESPONSE_ALREADY_RECORDED") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "RESPONSE_ALREADY_RECORDED",
          "Response already recorded for this preventivo",
        ),
      );
    return;
  }

  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", "FORBIDDEN"));
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("PREVENTIVO_NOT_FOUND", "Preventivo non trovato"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalFatturaPdfFailure(
  res: Response,
  result: Exclude<GetPortalFatturaPdfResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "UNAUTHORIZED") {
    res
      .status(401)
      .json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", "Parametri non validi"));
    return;
  }

  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", "FORBIDDEN"));
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("FATTURA_NOT_FOUND", "Fattura non trovata"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

function respondPortalPreventivoPdfFailure(
  res: Response,
  result: Exclude<GetPortalPreventivoPdfResult, { ok: true; data: unknown }>,
): void {
  if (result.code === "UNAUTHORIZED") {
    res
      .status(401)
      .json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", "Parametri non validi"));
    return;
  }

  if (result.code === "FORBIDDEN") {
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", "FORBIDDEN"));
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("PREVENTIVO_NOT_FOUND", "Preventivo non trovato"));
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

portalAuthRouter.use("/login", portalLoginRateLimitGuard);

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
    if (result.code === "INVALID_CREDENTIALS") {
      const rateLimitKey =
        typeof res.locals.portalRateLimitKey === "string"
          ? res.locals.portalRateLimitKey
          : resolvePortalRateLimitKey(
              resolveClientIp(req.header("x-forwarded-for"), req.ip || "0.0.0.0"),
              payload.email,
            );
      registerFailedAttemptForKey(rateLimitKey, portalLoginPolicy);
    }
    respondPortalLoginFailure(res, result);
    return;
  }

  const rateLimitKey =
    typeof res.locals.portalRateLimitKey === "string"
      ? res.locals.portalRateLimitKey
      : resolvePortalRateLimitKey(
          resolveClientIp(req.header("x-forwarded-for"), req.ip || "0.0.0.0"),
          payload.email,
        );
  clearFailedAttemptsForKey(rateLimitKey);

  let profileSummary: Awaited<
    ReturnType<typeof buildPortalProfileSummaryFromAccessToken>
  >;
  try {
    profileSummary = await buildPortalProfileSummaryFromAccessToken(result.data.accessToken);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  res.status(200).json({
    ...result.data,
    profileSummary,
  });
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

portalRouter.get("/me", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const accessJwt = authHeader.slice("Bearer ".length);

  let result: GetPortalDashboardResult;
  try {
    result = await getPortalDashboard(accessJwt);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalDashboardFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

portalRouter.get("/riparazioni", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const accessJwt = authHeader.slice("Bearer ".length);

  let result: ListPortalRiparazioniResult;
  try {
    result = await listPortalRiparazioni(accessJwt, {
      page: req.query.page,
      limit: req.query.limit,
      stato: req.query.stato,
    });
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalRiparazioniListFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

portalRouter.get("/riparazioni/:id", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const accessJwt = authHeader.slice("Bearer ".length);

  let result: GetPortalRiparazioneDettaglioResult;
  try {
    result = await getPortalRiparazioneDettaglio(accessJwt, req.params.id);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalRiparazioneDettaglioFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

portalRouter.post("/preventivi/:id/risposta", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const accessJwt = authHeader.slice("Bearer ".length);

  let result: RegistraPortalPreventivoRispostaResult;
  try {
    result = await registraRispostaPreventivoPortale(accessJwt, {
      preventivoId: req.params.id,
      approvato: req.body?.approvato,
    });
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalPreventivoRispostaFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

portalRouter.get("/documenti/fattura/:id/pdf", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const accessJwt = authHeader.slice("Bearer ".length);

  let result: GetPortalFatturaPdfResult;
  try {
    result = await getPortalFatturaPdf(accessJwt, req.params.id);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalFatturaPdfFailure(res, result);
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=\"${result.data.fileName}\"`,
  );
  res.status(200).send(result.data.content);
});

portalRouter.get("/documenti/preventivo/:id/pdf", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const accessJwt = authHeader.slice("Bearer ".length);

  let result: GetPortalPreventivoPdfResult;
  try {
    result = await getPortalPreventivoPdf(accessJwt, req.params.id);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalPreventivoPdfFailure(res, result);
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=\"${result.data.fileName}\"`,
  );
  res.status(200).send(result.data.content);
});

portalRouter.get("/ordini", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const accessJwt = authHeader.slice("Bearer ".length);

  let result: ListPortalOrdiniResult;
  try {
    result = await listPortalOrdini(accessJwt, {
      page: req.query.page,
      limit: req.query.limit,
      stato: req.query.stato,
    });
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalOrdiniListFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

portalRouter.get("/ordini/:id", async (req, res) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json(buildErrorResponse("UNAUTHORIZED", "Token mancante o non valido"));
    return;
  }

  const accessJwt = authHeader.slice("Bearer ".length);

  let result: GetPortalOrdineDettaglioResult;
  try {
    result = await getPortalOrdineDettaglio(accessJwt, req.params.id);
  } catch (error) {
    respondAuthServiceError(res, error);
    return;
  }

  if (!result.ok) {
    respondPortalOrdineDettaglioFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

export { authRouter, portalAuthRouter, portalRouter };
