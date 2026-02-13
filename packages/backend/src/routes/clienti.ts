import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import {
  createPortalAccountForCliente,
  type CreatePortalAccountResult,
} from "../services/auth-service.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createCliente,
  getClienteById,
  listClienti,
  listClienteRiparazioni,
  updateCliente,
  type CreateClienteInput,
  type CreateClienteResult,
  type GetClienteByIdInput,
  type GetClienteByIdResult,
  type ListClienteRiparazioniInput,
  type ListClienteRiparazioniResult,
  type ListClientiInput,
  type ListClientiResult,
  type UpdateClienteInput,
  type UpdateClienteResult,
} from "../services/anagrafiche-service.js";

const clientiRouter = Router();

type CreateClienteFailure = Exclude<CreateClienteResult, { ok: true; data: unknown }>;
type ListClientiFailure = Exclude<ListClientiResult, { ok: true; data: unknown }>;
type GetClienteByIdFailure = Exclude<GetClienteByIdResult, { ok: true; data: unknown }>;
type UpdateClienteFailure = Exclude<UpdateClienteResult, { ok: true; data: unknown }>;
type ListClienteRiparazioniFailure = Exclude<
  ListClienteRiparazioniResult,
  { ok: true; data: unknown }
>;
type CreatePortalAccountFailure = Exclude<
  CreatePortalAccountResult,
  { ok: true; data: unknown }
>;

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

function respondListClientiFailure(
  res: Response,
  result: ListClientiFailure,
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
    .json(buildErrorResponse("ANAGRAFICHE_SERVICE_UNAVAILABLE", "Servizio anagrafiche non disponibile"));
}

function respondGetClienteByIdFailure(
  res: Response,
  result: GetClienteByIdFailure,
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
      .json(buildErrorResponse("CLIENTE_NOT_FOUND", "Cliente non trovato"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("ANAGRAFICHE_SERVICE_UNAVAILABLE", "Servizio anagrafiche non disponibile"));
}

function respondUpdateClienteFailure(
  res: Response,
  result: UpdateClienteFailure,
): void {
  if (result.code === "EMAIL_ALREADY_EXISTS") {
    res
      .status(409)
      .json(buildErrorResponse("EMAIL_ALREADY_EXISTS", "Email gia esistente"));
    return;
  }

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
      .json(buildErrorResponse("CLIENTE_NOT_FOUND", "Cliente non trovato"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("ANAGRAFICHE_SERVICE_UNAVAILABLE", "Servizio anagrafiche non disponibile"));
}

function respondListClienteRiparazioniFailure(
  res: Response,
  result: ListClienteRiparazioniFailure,
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
      .json(buildErrorResponse("CLIENTE_NOT_FOUND", "Cliente non trovato"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("ANAGRAFICHE_SERVICE_UNAVAILABLE", "Servizio anagrafiche non disponibile"));
}

function respondCreatePortalAccountFailure(
  res: Response,
  result: CreatePortalAccountFailure,
): void {
  if (result.code === "CUSTOMER_EMAIL_REQUIRED") {
    res
      .status(400)
      .json(buildErrorResponse("CUSTOMER_EMAIL_REQUIRED", "Customer email is required"));
    return;
  }

  if (result.code === "PORTAL_ACCOUNT_ALREADY_EXISTS") {
    res
      .status(409)
      .json(buildErrorResponse("PORTAL_ACCOUNT_ALREADY_EXISTS", "Portal account already exists"));
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("AUTH_SERVICE_UNAVAILABLE", "Servizio autenticazione non disponibile"));
}

clientiRouter.get("/", authenticate, async (req, res) => {
  const payload: ListClientiInput = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    tipologia: req.query.tipologia,
  };

  const result = await listClienti(payload);
  if (!result.ok) {
    respondListClientiFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

clientiRouter.get("/:id", authenticate, async (req, res) => {
  const payload: GetClienteByIdInput = {
    clienteId: req.params.id,
  };

  const result = await getClienteById(payload);
  if (!result.ok) {
    respondGetClienteByIdFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

clientiRouter.put("/:id", authenticate, async (req, res) => {
  const payload: UpdateClienteInput = {
    actorUserId: req.user?.userId,
    clienteId: req.params.id,
    telefono: req.body?.telefono,
    email: req.body?.email,
  };

  const result = await updateCliente(payload);
  if (!result.ok) {
    respondUpdateClienteFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

clientiRouter.get("/:id/riparazioni", authenticate, async (req, res) => {
  const payload: ListClienteRiparazioniInput = {
    clienteId: req.params.id,
  };

  const result = await listClienteRiparazioni(payload);
  if (!result.ok) {
    respondListClienteRiparazioniFailure(res, result);
    return;
  }

  res.status(200).json(result.data);
});

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

clientiRouter.post("/:id/portal-account", authenticate, authorize("ADMIN", "COMMERCIALE"), async (req, res) => {
  const clienteResult = await getClienteById({ clienteId: req.params.id });
  if (!clienteResult.ok) {
    respondGetClienteByIdFailure(res, clienteResult);
    return;
  }

  const result = await createPortalAccountForCliente({
    clienteId: clienteResult.data.data.id,
    email: clienteResult.data.data.email,
  });

  if (!result.ok) {
    respondCreatePortalAccountFailure(res, result);
    return;
  }

  res.status(201).json({ data: result.data });
});

export { clientiRouter };
