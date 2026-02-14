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
  listRichiesteBackoffice,
  type ListRichiesteBackofficeInput,
  type ListRichiesteBackofficeResult,
} from "../services/anagrafiche-service.js";

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

export { richiesteRouter };
