interface CreateCheckoutSessionInput {
  fatturaId: number;
}

interface CreateCheckoutSessionOutput {
  sessionId: string;
  paymentUrl: string;
}

function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): CreateCheckoutSessionOutput {
  const timestamp = Date.now();
  const sessionId = `cs_test_fattura_${input.fatturaId}_${timestamp}`;
  return {
    sessionId,
    paymentUrl: `https://checkout.stripe.com/pay/${sessionId}`,
  };
}

function verifyWebhookSignature(signature: string | undefined): boolean {
  if (!signature) {
    return false;
  }

  return signature.includes("v1=valid-signature");
}

export { createCheckoutSession, verifyWebhookSignature };
