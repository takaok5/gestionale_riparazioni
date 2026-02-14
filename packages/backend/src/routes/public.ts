import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import {
  getRetryAfterSecondsForKey,
  registerFailedAttemptForKey,
  type RateLimitPolicy,
} from "../services/login-rate-limit.js";
import {
  createPublicRichiesta,
  type CreatePublicRichiestaInput,
  type CreatePublicRichiestaResult,
  getPublicPageBySlug,
  type GetPublicPageBySlugInput,
  type GetPublicPageBySlugResult,
  getPublicServiceBySlug,
  type GetPublicServiceBySlugInput,
  type GetPublicServiceBySlugResult,
  listPublicFaq,
  type ListPublicFaqInput,
  type ListPublicFaqResult,
  listPublicServices,
  type ListPublicServicesInput,
  type ListPublicServicesResult,
} from "../services/anagrafiche-service.js";

const publicRouter = Router();
const publicRichiesteRateLimitPolicy: RateLimitPolicy = {
  maxFailedAttempts: 5,
  windowMs: 60_000,
  retryAfterCapSeconds: 60,
};

function resolvePublicRichiesteRateLimitKey(ip: string): string {
  return `public-richieste:${ip}`;
}

function resolveRequestIp(
  xForwardedForHeader: string | undefined,
  fallbackIp: string | undefined,
): string {
  if (!xForwardedForHeader) {
    return fallbackIp?.trim() || "unknown";
  }

  const [firstIp] = xForwardedForHeader.split(",");
  return firstIp?.trim() || fallbackIp?.trim() || "unknown";
}

type ListPublicServicesFailure = Exclude<
  ListPublicServicesResult,
  { ok: true; data: unknown }
>;

type GetPublicServiceBySlugFailure = Exclude<
  GetPublicServiceBySlugResult,
  { ok: true; data: unknown }
>;

type ListPublicFaqFailure = Exclude<ListPublicFaqResult, { ok: true; data: unknown }>;

type GetPublicPageBySlugFailure = Exclude<
  GetPublicPageBySlugResult,
  { ok: true; data: unknown }
>;

type CreatePublicRichiestaFailure = Exclude<
  CreatePublicRichiestaResult,
  { ok: true; data: unknown }
>;

function respondListPublicServicesFailure(
  res: Response,
  result: ListPublicServicesFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          result.message ?? "Parametri query non validi",
          result.details,
        ),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "PUBLIC_SERVICE_UNAVAILABLE",
        "Servizio pubblico non disponibile",
      ),
    );
}

function respondGetPublicServiceBySlugFailure(
  res: Response,
  result: GetPublicServiceBySlugFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          result.message ?? "Slug non valido",
          result.details,
        ),
      );
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(
        buildErrorResponse(
          "SERVICE_NOT_FOUND",
          "Servizio pubblico non trovato",
        ),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "PUBLIC_SERVICE_UNAVAILABLE",
        "Servizio pubblico non disponibile",
      ),
    );
}

function respondListPublicFaqFailure(
  res: Response,
  _result: ListPublicFaqFailure,
): void {
  res
    .status(500)
    .json(
      buildErrorResponse(
        "PUBLIC_FAQ_UNAVAILABLE",
        "FAQ pubbliche non disponibili",
      ),
    );
}

function respondGetPublicPageBySlugFailure(
  res: Response,
  result: GetPublicPageBySlugFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          result.message ?? "Slug pagina non valido",
          result.details,
        ),
      );
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(
        buildErrorResponse(
          "PAGE_NOT_FOUND",
          "Pagina pubblica non trovata",
        ),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "PUBLIC_PAGE_UNAVAILABLE",
        "Pagina pubblica non disponibile",
      ),
    );
}

function respondCreatePublicRichiestaFailure(
  res: Response,
  result: CreatePublicRichiestaFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          result.message ?? "Payload non valido",
          result.details,
        ),
      );
    return;
  }

  if (result.code === "INVALID_ANTISPAM_TOKEN") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "INVALID_ANTISPAM_TOKEN",
          "Token anti-spam non valido",
        ),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "PUBLIC_REQUEST_UNAVAILABLE",
        "Richiesta pubblica non disponibile",
      ),
    );
}

publicRouter.get("/services", async (req, res) => {
  const payload: ListPublicServicesInput = {
    categoria: req.query.categoria,
  };

  const result = await listPublicServices(payload);
  if (!result.ok) {
    respondListPublicServicesFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

publicRouter.get("/services/:slug", async (req, res) => {
  const payload: GetPublicServiceBySlugInput = {
    slug: req.params.slug,
  };

  const result = await getPublicServiceBySlug(payload);
  if (!result.ok) {
    respondGetPublicServiceBySlugFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

publicRouter.get("/faq", async (_req, res) => {
  const payload: ListPublicFaqInput = {};

  const result = await listPublicFaq(payload);
  if (!result.ok) {
    respondListPublicFaqFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

publicRouter.get("/pages/:slug", async (req, res) => {
  const payload: GetPublicPageBySlugInput = {
    slug: req.params.slug,
  };

  const result = await getPublicPageBySlug(payload);
  if (!result.ok) {
    respondGetPublicPageBySlugFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

publicRouter.post("/richieste", async (req, res) => {
  const forwardedHeader = req.headers["x-forwarded-for"];
  const requestIp = resolveRequestIp(
    typeof forwardedHeader === "string" ? forwardedHeader : undefined,
    req.ip,
  );
  const rateLimitKey = resolvePublicRichiesteRateLimitKey(requestIp);
  const retryAfter = getRetryAfterSecondsForKey(
    rateLimitKey,
    publicRichiesteRateLimitPolicy,
  );

  if (retryAfter !== null) {
    res.setHeader("Retry-After", String(retryAfter));
    res
      .status(429)
      .json(
        buildErrorResponse(
          "RATE_LIMIT_EXCEEDED",
          "Troppe richieste dallo stesso IP",
        ),
      );
    return;
  }

  const payload: CreatePublicRichiestaInput = {
    tipo: req.body?.tipo,
    nome: req.body?.nome,
    email: req.body?.email,
    problema: req.body?.problema,
    consensoPrivacy: req.body?.consensoPrivacy,
    antispamToken: req.body?.antispamToken,
  };

  const result = await createPublicRichiesta(payload);

  if (!result.ok) {
    registerFailedAttemptForKey(rateLimitKey, publicRichiesteRateLimitPolicy);
    respondCreatePublicRichiestaFailure(res, result);
    return;
  }

  res.status(201).json(result.data);
});

export { publicRouter };
