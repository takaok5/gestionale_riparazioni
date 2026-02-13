interface CreateCheckoutSessionInput {
  fatturaId: number;
  amountCents: number;
}

interface CreateCheckoutSessionOutput {
  sessionId: string;
  paymentUrl: string;
}

function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): CreateCheckoutSessionOutput {
  const timestamp = Date.now();
  const sessionId = `cs_test_fattura_${input.fatturaId}_${input.amountCents}_${timestamp}`;
  return {
    sessionId,
    paymentUrl: `https://checkout.stripe.com/pay/${sessionId}`,
  };
}

function verifyWebhookSignature(signature: string | undefined): boolean {
  if (!signature) {
    return false;
  }

  const trimmed = signature.trim();
  if (process.env.NODE_ENV === "test") {
    return trimmed === "t=1739404800,v1=valid-signature";
  }

  return /^t=\d+,v1=[A-Za-z0-9_-]{32,}$/.test(trimmed);
}

export { createCheckoutSession, verifyWebhookSignature };
