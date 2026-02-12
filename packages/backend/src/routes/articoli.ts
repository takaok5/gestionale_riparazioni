import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createArticolo,
  createArticoloMovimento,
  type CreateArticoloMovimentoInput,
  type CreateArticoloMovimentoResult,
  type CreateArticoloInput,
  type CreateArticoloResult,
  listArticoli,
  listArticoliAlert,
  type ListArticoliAlertInput,
  type ListArticoliAlertResult,
  type ListArticoliInput,
  type ListArticoliResult,
} from "../services/anagrafiche-service.js";

const articoliRouter = Router();

type CreateArticoloFailure = Exclude<
  CreateArticoloResult,
  { ok: true; data: unknown }
>;

type CreateArticoloMovimentoFailure = Exclude<
  CreateArticoloMovimentoResult,
  { ok: true; data: unknown }
>;

type ListArticoliFailure = Exclude<
  ListArticoliResult,
  { ok: true; data: unknown }
>;

type ListArticoliAlertFailure = Exclude<
  ListArticoliAlertResult,
  { ok: true; data: unknown }
>;

function respondCreateArticoloFailure(
  res: Response,
  result: CreateArticoloFailure,
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

  if (result.code === "CODICE_ARTICOLO_EXISTS") {
    res
      .status(409)
      .json(
        buildErrorResponse(
          "CODICE_ARTICOLO_EXISTS",
          "Codice articolo gia esistente",
        ),
      );
    return;
  }

  if (result.code === "NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("FORNITORE_NOT_FOUND", "Fornitore non trovato"));
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

function respondCreateArticoloMovimentoFailure(
  res: Response,
  result: CreateArticoloMovimentoFailure,
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
      .json(buildErrorResponse("ARTICOLO_NOT_FOUND", "Articolo non trovato"));
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
        "ANAGRAFICHE_SERVICE_UNAVAILABLE",
        "Servizio anagrafiche non disponibile",
      ),
    );
}

function respondListArticoliFailure(
  res: Response,
  result: ListArticoliFailure,
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
        "ANAGRAFICHE_SERVICE_UNAVAILABLE",
        "Servizio anagrafiche non disponibile",
      ),
    );
}

function respondListArticoliAlertFailure(
  res: Response,
  _result: ListArticoliAlertFailure,
): void {
  res
    .status(500)
    .json(
      buildErrorResponse(
        "ANAGRAFICHE_SERVICE_UNAVAILABLE",
        "Servizio anagrafiche non disponibile",
      ),
    );
}

articoliRouter.get(
  "/",
  authenticate,
  authorize("TECNICO", "ADMIN"),
  async (req, res) => {
    const payload: ListArticoliInput = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      categoria: req.query.categoria,
    };

    const result = await listArticoli(payload);
    if (!result.ok) {
      respondListArticoliFailure(res, result);
      return;
    }

    res.status(200).json(result.data);
  },
);

articoliRouter.get(
  "/alert",
  authenticate,
  authorize("TECNICO", "ADMIN"),
  async (_req, res) => {
    const payload: ListArticoliAlertInput = {};
    const result = await listArticoliAlert(payload);
    if (!result.ok) {
      respondListArticoliAlertFailure(res, result);
      return;
    }

    res.status(200).json(result.data);
  },
);

articoliRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const payload: CreateArticoloInput = {
      actorUserId: req.user?.userId,
      codiceArticolo: req.body?.codiceArticolo,
      nome: req.body?.nome,
      descrizione: req.body?.descrizione,
      categoria: req.body?.categoria,
      fornitoreId: req.body?.fornitoreId,
      prezzoAcquisto: req.body?.prezzoAcquisto,
      prezzoVendita: req.body?.prezzoVendita,
      sogliaMinima: req.body?.sogliaMinima,
    };

    const result = await createArticolo(payload);
    if (!result.ok) {
      respondCreateArticoloFailure(res, result);
      return;
    }

    res.status(201).json(result.data);
  },
);

articoliRouter.post(
  "/:articoloId/movimenti",
  authenticate,
  authorize("TECNICO", "ADMIN"),
  async (req, res) => {
    const payload: CreateArticoloMovimentoInput = {
      actorUserId: req.user?.userId,
      articoloId: req.params.articoloId,
      tipo: req.body?.tipo,
      quantita: req.body?.quantita,
      riferimento: req.body?.riferimento,
    };

    const result = await createArticoloMovimento(payload);
    if (!result.ok) {
      respondCreateArticoloMovimentoFailure(res, result);
      return;
    }

    res.status(201).json(result.data);
  },
);

export { articoliRouter };
