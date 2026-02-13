import { Router, type Response } from "express";
import { buildErrorResponse } from "../lib/errors.js";
import {
  handleStripeWebhook,
  type HandleStripeWebhookInput,
  type HandleStripeWebhookResult,
} from "../services/fatture-service.js";

const stripeWebhooksRouter = Router();

type HandleStripeWebhookFailure = Exclude<
  HandleStripeWebhookResult,
  { ok: true; data: unknown }
>;

function parseWebhookPayload(body: unknown): unknown | null {
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf8"));
    } catch {
      return null;
    }
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  if (typeof body === "object" && body !== null) {
    return body;
  }

  return null;
}

function respondHandleStripeWebhookFailure(
  res: Response,
  result: HandleStripeWebhookFailure,
): void {
  if (result.code === "INVALID_SIGNATURE") {
    res
      .status(400)
      .json(buildErrorResponse("INVALID_SIGNATURE", "Invalid signature"));
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

  if (result.code === "FATTURA_NOT_FOUND") {
    res
      .status(404)
      .json(buildErrorResponse("FATTURA_NOT_FOUND", "Fattura non trovata"));
    return;
  }

  if (result.code === "OVERPAYMENT_NOT_ALLOWED") {
    res
      .status(400)
      .json(
        buildErrorResponse(
          "OVERPAYMENT_NOT_ALLOWED",
          "Total payments would exceed invoice total",
        ),
      );
    return;
  }

  res
    .status(500)
    .json(buildErrorResponse("WEBHOOK_UNAVAILABLE", "Webhook service unavailable"));
}

stripeWebhooksRouter.post("/", async (req, res) => {
  const parsedPayload = parseWebhookPayload(req.body);
  if (!parsedPayload) {
    res
      .status(400)
      .json(buildErrorResponse("VALIDATION_ERROR", "Payload non valido"));
    return;
  }

  const payload: HandleStripeWebhookInput = {
    signature: req.headers["stripe-signature"],
    payload: parsedPayload,
  };
  const result = await handleStripeWebhook(payload);

  if (!result.ok) {
    respondHandleStripeWebhookFailure(res, result);
    return;
  }

  res.status(200).json({ received: true, duplicate: result.data.duplicate });
});

export { stripeWebhooksRouter };
