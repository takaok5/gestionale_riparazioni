import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  assegnaPublicRichiesta,
  type AssegnaPublicRichiestaInput,
  type AssegnaPublicRichiestaResult,
  cambiaStatoPublicRichiesta,
  type CambiaStatoPublicRichiestaInput,
  type CambiaStatoPublicRichiestaResult,
  convertiPublicRichiesta,
  type ConvertiPublicRichiestaInput,
  type ConvertiPublicRichiestaResult,
  finalizzaConversionePublicRichiesta,
  type FinalizzaConversionePublicRichiestaInput,
  type FinalizzaConversionePublicRichiestaResult,
  listRichiesteBackoffice,
  type ListRichiesteBackofficeInput,
  type ListRichiesteBackofficeResult,
} from "../services/anagrafiche-service.js";
import {
  createRiparazione,
  type CreateRiparazioneInput,
  type CreateRiparazioneResult,
} from "../services/riparazioni-service.js";

const richiesteRouter = Router();

type ListRichiesteBackofficeFailure = Exclude<
  ListRichiesteBackofficeResult,
  { ok: true; data: unknown }
>;

type CambiaStatoPublicRichiestaFailure = Exclude<
  CambiaStatoPublicRichiestaResult,
  { ok: true; data: unknown }
>;

type AssegnaPublicRichiestaFailure = Exclude<
  AssegnaPublicRichiestaResult,
  { ok: true; data: unknown }
>;

type ConvertiPublicRichiestaFailure = Exclude<
  ConvertiPublicRichiestaResult,
  { ok: true; data: unknown }
>;

type FinalizzaConversionePublicRichiestaFailure = Exclude<
  FinalizzaConversionePublicRichiestaResult,
  { ok: true; data: unknown }
>;

type CreateRiparazioneFailure = Exclude<
  CreateRiparazioneResult,
  { ok: true; data: unknown }
>;

function respondListRichiesteBackofficeFailure(
  res: Response,
  result: ListRichiesteBackofficeFailure,
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
        "ANAGRAFICHE_SERVICE_UNAVAILABLE",
        "Servizio anagrafiche non disponibile",
      ),
    );
}

function respondCambiaStatoPublicRichiestaFailure(
  res: Response,
  result: CambiaStatoPublicRichiestaFailure,
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
        buildErrorResponse("RICHIESTA_NOT_FOUND", "Richiesta non trovata"),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "ANAGRAFICHE_SERVICE_UNAVAILABLE",
        "Servizio anagrafiche non disponibile",
      ),
    );
}

function respondAssegnaPublicRichiestaFailure(
  res: Response,
  result: AssegnaPublicRichiestaFailure,
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
        buildErrorResponse("RICHIESTA_NOT_FOUND", "Richiesta non trovata"),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "ANAGRAFICHE_SERVICE_UNAVAILABLE",
        "Servizio anagrafiche non disponibile",
      ),
    );
}

function respondConvertiPublicRichiestaFailure(
  res: Response,
  result: ConvertiPublicRichiestaFailure | FinalizzaConversionePublicRichiestaFailure,
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
        buildErrorResponse("RICHIESTA_NOT_FOUND", "Richiesta non trovata"),
      );
    return;
  }

  if (result.code === "ALREADY_CONVERTED") {
    res
      .status(409)
      .json(
        buildErrorResponse(
          "REQUEST_ALREADY_CONVERTED",
          "Request already converted",
        ),
      );
    return;
  }

  res
    .status(500)
    .json(
      buildErrorResponse(
        "ANAGRAFICHE_SERVICE_UNAVAILABLE",
        "Servizio anagrafiche non disponibile",
      ),
    );
}

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

function buildRiparazioneDraftPayloadFromLead(input: {
  actorUserId: number;
  clienteId: number;
  leadId: number;
  problema: string;
}): CreateRiparazioneInput {
  return {
    actorUserId: input.actorUserId,
    clienteId: input.clienteId,
    tipoDispositivo: "NON_SPECIFICATO",
    marcaDispositivo: "NON_SPECIFICATA",
    modelloDispositivo: "NON_SPECIFICATO",
    serialeDispositivo: `LEAD-${input.leadId}`,
    descrizioneProblema: input.problema,
    accessoriConsegnati: "NESSUNO",
    priorita: "NORMALE",
  };
}

richiesteRouter.get(
  "/",
  authenticate,
  authorize("COMMERCIALE", "ADMIN"),
  async (req, res) => {
    const payload: ListRichiesteBackofficeInput = {
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await listRichiesteBackoffice(payload);
    if (!result.ok) {
      respondListRichiesteBackofficeFailure(res, result);
      return;
    }

    res.status(200).json(result.data);
  },
);

richiesteRouter.patch(
  "/:id/stato",
  authenticate,
  authorize("COMMERCIALE", "ADMIN"),
  async (req, res) => {
    const payload: CambiaStatoPublicRichiestaInput = {
      actorUserId: req.user?.userId,
      richiestaId: req.params.id,
      stato: req.body?.stato,
    };

    const result = await cambiaStatoPublicRichiesta(payload);
    if (!result.ok) {
      respondCambiaStatoPublicRichiestaFailure(res, result);
      return;
    }

    res.status(200).json(result.data);
  },
);

richiesteRouter.patch(
  "/:id/assegna",
  authenticate,
  authorize("COMMERCIALE", "ADMIN"),
  async (req, res) => {
    const actorUserId = req.user?.userId;
    const requestedCommercialeId = req.body?.commercialeId ?? actorUserId;
    if (
      req.user?.role === "COMMERCIALE" &&
      String(requestedCommercialeId) !== String(actorUserId)
    ) {
      res
        .status(400)
        .json(
          buildErrorResponse(
            "VALIDATION_ERROR",
            "Commerciale puo assegnare solo a se stesso",
            {
              field: "commercialeId",
              rule: "self_assignment_required",
            },
          ),
        );
      return;
    }

    const payload: AssegnaPublicRichiestaInput = {
      actorUserId,
      richiestaId: req.params.id,
      commercialeId: requestedCommercialeId,
    };

    const result = await assegnaPublicRichiesta(payload);
    if (!result.ok) {
      respondAssegnaPublicRichiestaFailure(res, result);
      return;
    }

    res.status(200).json(result.data);
  },
);

richiesteRouter.post(
  "/:id/converti",
  authenticate,
  authorize("COMMERCIALE", "ADMIN"),
  async (req, res) => {
    const actorUserId = req.user?.userId;
    if (actorUserId === undefined) {
      res
        .status(401)
        .json(buildErrorResponse("UNAUTHORIZED", "Utente non autenticato"));
      return;
    }

    const modeRaw =
      typeof req.body?.mode === "string" ? req.body.mode.trim().toUpperCase() : "RIPARAZIONE";
    if (modeRaw !== "RIPARAZIONE") {
      res
        .status(400)
        .json(
          buildErrorResponse("VALIDATION_ERROR", "mode must be RIPARAZIONE", {
            field: "mode",
            rule: "invalid_enum",
          }),
        );
      return;
    }

    const conversionPayload: ConvertiPublicRichiestaInput = {
      actorUserId,
      richiestaId: req.params.id,
      deferStateChange: true,
    };

    const conversionResult = await convertiPublicRichiesta(conversionPayload);
    if (!conversionResult.ok) {
      respondConvertiPublicRichiestaFailure(res, conversionResult);
      return;
    }

    const riparazionePayload = buildRiparazioneDraftPayloadFromLead({
      actorUserId,
      clienteId: conversionResult.data.data.cliente.id,
      leadId: conversionResult.data.data.lead.id,
      problema: conversionResult.data.data.lead.problema,
    });

    const riparazioneResult = await createRiparazione(riparazionePayload);
    if (!riparazioneResult.ok) {
      respondCreateRiparazioneFailure(res, riparazioneResult);
      return;
    }

    const finalizePayload: FinalizzaConversionePublicRichiestaInput = {
      actorUserId,
      richiestaId: req.params.id,
    };
    const finalizeResult = await finalizzaConversionePublicRichiesta(finalizePayload);
    if (!finalizeResult.ok) {
      respondConvertiPublicRichiestaFailure(res, finalizeResult);
      return;
    }

    res.status(200).json({
      data: {
        richiesta: finalizeResult.data.data,
        cliente: conversionResult.data.data.cliente,
        riparazione: riparazioneResult.data,
      },
    });
  },
);

export { richiesteRouter };
