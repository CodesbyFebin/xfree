import { config } from "./env";

export interface DeliveryPayload {
  subject: string;
  text: string;
  meta?: Record<string, unknown>;
}

export async function deliverMessage(kind: "contact" | "feedback" | "lead", payload: DeliveryPayload): Promise<{ ok: boolean; provider: string }> {
  if (config.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.CONTACT_FROM_EMAIL,
          to: [config.CONTACT_TO_EMAIL],
          subject: `[xfree.in ${kind}] ${payload.subject}`,
          text: payload.text + (payload.meta ? `\n\n---\n${JSON.stringify(payload.meta, null, 2)}` : ""),
        }),
      });
      if (!res.ok) {
        console.error(`[delivery] resend failed: ${res.status}`);
        return { ok: false, provider: "resend" };
      }
      return { ok: true, provider: "resend" };
    } catch (err) {
      console.error("[delivery] resend error", err);
      return { ok: false, provider: "resend" };
    }
  }
  console.log(`[delivery:${kind}] ${payload.subject}\n${payload.text}`, payload.meta ?? {});
  return { ok: true, provider: "log" };
}
