import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import {
  getPublicServiceBySlug,
  type GetPublicServiceBySlugInput,
  type GetPublicServiceBySlugResult,
  listPublicServices,
  type ListPublicServicesInput,
  type ListPublicServicesResult,
} from "../services/anagrafiche-service.js";

const publicRouter = Router();

type ListPublicServicesFailure = Exclude<
  ListPublicServicesResult,
  { ok: true; data: unknown }
>;

type GetPublicServiceBySlugFailure = Exclude<
  GetPublicServiceBySlugResult,
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

export { publicRouter };
