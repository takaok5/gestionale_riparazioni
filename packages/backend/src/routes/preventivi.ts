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
  inviaPreventivo,
  type InviaPreventivoInput,
  type InviaPreventivoResult,
  registraRispostaPreventivo,
  type RegistraRispostaPreventivoInput,
  type RegistraRispostaPreventivoResult,
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

type InviaPreventivoFailure = Exclude<
  InviaPreventivoResult,
  { ok: true; data: unknown }
>;

type RegistraRispostaPreventivoFailure = Exclude<
  RegistraRispostaPreventivoResult,
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

function respondInviaPreventivoFailure(
  res: Response,
  result: InviaPreventivoFailure,
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

  if (result.code === "EMAIL_SEND_FAILED") {
    res
      .status(500)
      .json(buildErrorResponse("EMAIL_SEND_FAILED", result.message));
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

function respondRegistraRispostaPreventivoFailure(
  res: Response,
  result: RegistraRispostaPreventivoFailure,
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

preventiviRouter.post("/:id/invia", authenticate, async (req, res) => {
  const payload: InviaPreventivoInput = {
    preventivoId: req.params.id,
  };

  const result = await inviaPreventivo(payload);
  if (!result.ok) {
    respondInviaPreventivoFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

preventiviRouter.patch("/:id/risposta", authenticate, async (req, res) => {
  if (req.user?.role !== "COMMERCIALE") {
    res
      .status(403)
      .json(
        buildErrorResponse(
          "FORBIDDEN",
          "Operazione consentita solo al ruolo COMMERCIALE",
        ),
      );
    return;
  }

  const payload: RegistraRispostaPreventivoInput = {
    preventivoId: req.params.id,
    approvato: req.body?.approvato,
  };

  const result = await registraRispostaPreventivo(payload);
  if (!result.ok) {
    respondRegistraRispostaPreventivoFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
});

export { preventiviRouter };
