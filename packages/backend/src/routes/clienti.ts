import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import { authenticate } from "../middleware/auth.js";
import {
  createCliente,
  type CreateClienteInput,
  type CreateClienteResult,
} from "../services/anagrafiche-service.js";

const clientiRouter = Router();

type CreateClienteFailure = Exclude<CreateClienteResult, { ok: true; data: unknown }>;

function respondCreateClienteFailure(
  res: Response,
  result: CreateClienteFailure,
): void {
  if (result.code === "VALIDATION_ERROR") {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", result.message ?? "Payload non valido", result.details));
    return;
  }

  if (result.code === "EMAIL_ALREADY_EXISTS") {
    res
      .status(409)
      .json(buildErrorResponse("EMAIL_ALREADY_EXISTS", "Email gia esistente"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("ANAGRAFICHE_SERVICE_UNAVAILABLE", "Servizio anagrafiche non disponibile"));
}

clientiRouter.post("/", authenticate, async (req, res) => {
  const payload: CreateClienteInput = {
    actorUserId: req.user?.userId,
    nome: req.body?.nome,
    cognome: req.body?.cognome,
    ragioneSociale: req.body?.ragioneSociale,
    tipologia: req.body?.tipologia,
    indirizzo: req.body?.indirizzo,
    citta: req.body?.citta,
    cap: req.body?.cap,
    provincia: req.body?.provincia,
    telefono: req.body?.telefono,
    email: req.body?.email,
    partitaIva: req.body?.partitaIva,
    codiceFiscale: req.body?.codiceFiscale,
  };

  const result = await createCliente(payload);
  if (!result.ok) {
    respondCreateClienteFailure(res, result);
    return;
  }

  res.status(201).json(result.data);
});

export { clientiRouter };
