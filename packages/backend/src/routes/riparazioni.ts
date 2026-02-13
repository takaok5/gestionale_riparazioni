import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  assegnaRiparazioneTecnico,
  type AssegnaRiparazioneTecnicoInput,
  type AssegnaRiparazioneTecnicoResult,
  cambiaStatoRiparazione,
  type CambiaStatoRiparazioneInput,
  type CambiaStatoRiparazioneResult,
  createRiparazioneRicambio,
  type CreateRiparazioneRicambioInput,
  type CreateRiparazioneRicambioResult,
  createRiparazione,
  type CreateRiparazioneInput,
  type CreateRiparazioneResult,
  getRiparazioneDettaglio,
  type GetRiparazioneDettaglioInput,
  type GetRiparazioneDettaglioResult,
  getRiparazioneEtichettaPdf,
  type GetRiparazioneEtichettaPdfInput,
  type GetRiparazioneEtichettaPdfResult,
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

type GetRiparazioneEtichettaPdfFailure = Exclude<
  GetRiparazioneEtichettaPdfResult,
  { ok: true; data: unknown }
>;

type AssegnaRiparazioneTecnicoFailure = Exclude<
  AssegnaRiparazioneTecnicoResult,
  { ok: true; data: unknown }
>;

type CambiaStatoRiparazioneFailure = Exclude<
  CambiaStatoRiparazioneResult,
  { ok: true; data: unknown }
>;

type CreateRiparazioneRicambioFailure = Exclude<
  CreateRiparazioneRicambioResult,
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

function respondGetRiparazioneEtichettaPdfFailure(
  res: Response,
  result: GetRiparazioneEtichettaPdfFailure,
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

function respondAssegnaRiparazioneTecnicoFailure(
  res: Response,
  result: AssegnaRiparazioneTecnicoFailure,
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
      .json(
        buildErrorResponse("RIPARAZIONE_NOT_FOUND", "Riparazione non trovata"),
      );
    return;
  }

  if (result.code === "USER_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("USER_NOT_FOUND", "Utente non trovato"));
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

function respondCambiaStatoRiparazioneFailure(
  res: Response,
  result: CambiaStatoRiparazioneFailure,
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
      .json(
        buildErrorResponse("RIPARAZIONE_NOT_FOUND", "Riparazione non trovata"),
      );
    return;
  }

  if (result.code === "FORBIDDEN") {
    const message = result.message ?? "Accesso negato";
    res
      .status(403)
      .json(buildErrorResponse("FORBIDDEN", message));
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

function respondCreateRiparazioneRicambioFailure(
  res: Response,
  result: CreateRiparazioneRicambioFailure,
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
      .json(
        buildErrorResponse("RIPARAZIONE_NOT_FOUND", "Riparazione non trovata"),
      );
    return;
  }

  if (result.code === "ARTICOLO_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("ARTICOLO_NOT_FOUND", "ARTICOLO_NOT_FOUND"));
    return;
  }

  if (result.code === "INSUFFICIENT_STOCK") {
    res
      .status(400)
      .json(buildErrorResponse("INSUFFICIENT_STOCK", result.message));
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

riparazioniRouter.get(
  "/:id/etichetta",
  authenticate,
  authorize("TECNICO"),
  async (req, res) => {
    const payload: GetRiparazioneEtichettaPdfInput = {
      riparazioneId: req.params.id,
    };

    const result = await getRiparazioneEtichettaPdf(payload);
    if (!result.ok) {
      respondGetRiparazioneEtichettaPdfFailure(res, result);
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${result.data.fileName}\"`,
    );
    res.status(200).send(result.data.content);
  },
);

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

riparazioniRouter.patch(
  "/:id/assegna",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const payload: AssegnaRiparazioneTecnicoInput = {
      riparazioneId: req.params.id,
      tecnicoId: req.body?.tecnicoId,
    };

    const result = await assegnaRiparazioneTecnico(payload);
    if (!result.ok) {
      respondAssegnaRiparazioneTecnicoFailure(res, result);
      return;
    }

    res.status(200).json({ data: result.data });
  },
);

riparazioniRouter.patch("/:id/stato", authenticate, async (req, res) => {
  const payload: CambiaStatoRiparazioneInput = {
    riparazioneId: req.params.id,
    actorUserId: req.user?.userId,
    actorRole: req.user?.role,
    stato: req.body?.stato,
    note: req.body?.note,
  };

  const result = await cambiaStatoRiparazione(payload);
  if (!result.ok) {
    respondCambiaStatoRiparazioneFailure(res, result);
    return;
  }

  res.status(200).json({ data: result.data });
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

riparazioniRouter.post(
  "/:id/ricambi",
  authenticate,
  authorize("TECNICO", "ADMIN"),
  async (req, res) => {
    const payload: CreateRiparazioneRicambioInput = {
      riparazioneId: req.params.id,
      actorUserId: req.user?.userId,
      articoloId: req.body?.articoloId,
      quantita: req.body?.quantita,
    };

    const result = await createRiparazioneRicambio(payload);
    if (!result.ok) {
      respondCreateRiparazioneRicambioFailure(res, result);
      return;
    }

    res.status(201).json({ data: result.data });
  },
);

export { riparazioniRouter };
