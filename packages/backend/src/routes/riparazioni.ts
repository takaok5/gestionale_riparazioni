import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  createRiparazione,
  type CreateRiparazioneInput,
  type CreateRiparazioneResult,
  getRiparazioneDettaglio,
  type GetRiparazioneDettaglioInput,
  type GetRiparazioneDettaglioResult,
  listRiparazioni,
  type ListRiparazioniInput,
  type ListRiparazioniResult,
} from "../services/riparazioni-service.js";

const riparazioniRouter = Router();

type CreateRiparazioneFailure = Exclude<
  CreateRiparazioneResult,
  { ok: true; data: unknown }
>;

type ListRiparazioniFailure = Exclude<
  ListRiparazioniResult,
  { ok: true; data: unknown }
>;

type GetRiparazioneDettaglioFailure = Exclude<
  GetRiparazioneDettaglioResult,
  { ok: true; data: unknown }
>;

function respondCreateRiparazioneFailure(
  res: Response,
  result: CreateRiparazioneFailure,
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

  if (result.code === "CLIENTE_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("CLIENTE_NOT_FOUND", "Cliente non trovato"));
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "RIPARAZIONI_SERVICE_UNAVAILABLE",
        "Servizio riparazioni non disponibile",
      ),
    );
}

function respondListRiparazioniFailure(
  res: Response,
  result: ListRiparazioniFailure,
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

  res
    .status(500)
    .json(
      buildErrorResponse(
        "RIPARAZIONI_SERVICE_UNAVAILABLE",
        "Servizio riparazioni non disponibile",
      ),
    );
}

function respondGetRiparazioneDettaglioFailure(
  res: Response,
  result: GetRiparazioneDettaglioFailure,
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
      .json(
        buildErrorResponse("RIPARAZIONE_NOT_FOUND", "Riparazione non trovata"),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "RIPARAZIONI_SERVICE_UNAVAILABLE",
        "Servizio riparazioni non disponibile",
      ),
    );
}

riparazioniRouter.get("/", authenticate, async (req, res) => {
  const payload: ListRiparazioniInput = {
    page: req.query.page,
    limit: req.query.limit,
    stato: req.query.stato,
    tecnicoId: req.query.tecnicoId,
    priorita: req.query.priorita,
    dataRicezioneDa: req.query.dataRicezioneDa,
    dataRicezioneA: req.query.dataRicezioneA,
    search: req.query.search,
  };

  const result = await listRiparazioni(payload);
  if (!result.ok) {
    respondListRiparazioniFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

riparazioniRouter.get("/:id", authenticate, async (req, res) => {
  const payload: GetRiparazioneDettaglioInput = {
    riparazioneId: req.params.id,
  };

  const result = await getRiparazioneDettaglio(payload);
  if (!result.ok) {
    respondGetRiparazioneDettaglioFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

riparazioniRouter.post("/", authenticate, async (req, res) => {
  const payload: CreateRiparazioneInput = {
    actorUserId: req.user?.userId,
    clienteId: req.body?.clienteId,
    tipoDispositivo: req.body?.tipoDispositivo,
    marcaDispositivo: req.body?.marcaDispositivo,
    modelloDispositivo: req.body?.modelloDispositivo,
    serialeDispositivo: req.body?.serialeDispositivo,
    descrizioneProblema: req.body?.descrizioneProblema,
    accessoriConsegnati: req.body?.accessoriConsegnati,
    priorita: req.body?.priorita,
  };

  const result = await createRiparazione(payload);
  if (!result.ok) {
    respondCreateRiparazioneFailure(res, result);
    return;
  }

  res.status(201).json(result.data);
});

export { riparazioniRouter };
