import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  createPreventivo,
  type CreatePreventivoInput,
  type CreatePreventivoResult,
  getPreventivoDettaglio,
  type GetPreventivoDettaglioInput,
  type GetPreventivoDettaglioResult,
  updatePreventivo,
  type UpdatePreventivoInput,
  type UpdatePreventivoResult,
} from "../services/preventivi-service.js";

const preventiviRouter = Router();

type CreatePreventivoFailure = Exclude<
  CreatePreventivoResult,
  { ok: true; data: unknown }
>;

type GetPreventivoDettaglioFailure = Exclude<
  GetPreventivoDettaglioResult,
  { ok: true; data: unknown }
>;

type UpdatePreventivoFailure = Exclude<
  UpdatePreventivoResult,
  { ok: true; data: unknown }
>;

function respondCreatePreventivoFailure(
  res: Response,
  result: CreatePreventivoFailure,
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

  if (result.code === "RIPARAZIONE_NOT_FOUND") {
    res
      .status(404)
      .json(
        buildErrorResponse("RIPARAZIONE_NOT_FOUND", "Riparazione non trovata"),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "PREVENTIVI_SERVICE_UNAVAILABLE",
        "Servizio preventivi non disponibile",
      ),
    );
}

function respondGetPreventivoDettaglioFailure(
  res: Response,
  result: GetPreventivoDettaglioFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          result.message ?? "Parametri non validi",
          result.details,
        ),
      );
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
    .json(
      buildErrorResponse(
        "PREVENTIVI_SERVICE_UNAVAILABLE",
        "Servizio preventivi non disponibile",
      ),
    );
}

function respondUpdatePreventivoFailure(
  res: Response,
  result: UpdatePreventivoFailure,
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

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("PREVENTIVO_NOT_FOUND", "Preventivo non trovato"));
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "PREVENTIVI_SERVICE_UNAVAILABLE",
        "Servizio preventivi non disponibile",
      ),
    );
}

preventiviRouter.post("/", authenticate, async (req, res) => {
  const payload: CreatePreventivoInput = {
    riparazioneId: req.body?.riparazioneId,
    voci: req.body?.voci,
  };

  const result = await createPreventivo(payload);
  if (!result.ok) {
    respondCreatePreventivoFailure(res, result);
    return;
  }

  res.status(201).json(result.data);
});

preventiviRouter.get("/:id", authenticate, async (req, res) => {
  const payload: GetPreventivoDettaglioInput = {
    preventivoId: req.params.id,
  };

  const result = await getPreventivoDettaglio(payload);
  if (!result.ok) {
    respondGetPreventivoDettaglioFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

preventiviRouter.put("/:id", authenticate, async (req, res) => {
  const payload: UpdatePreventivoInput = {
    preventivoId: req.params.id,
    voci: req.body?.voci,
  };

  const result = await updatePreventivo(payload);
  if (!result.ok) {
    respondUpdatePreventivoFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

export { preventiviRouter };
