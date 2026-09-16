// Structured audit logging for paid-provider requests. Deliberately omits
// prompt/message/reply bodies and raw IPs - only the hashed rate-limit key
// (see paidGuard.ts), provider, model, outcome and timing. Vercel captures
// stdout as durable, queryable function logs, so this doesn't need a
// separate log sink to be a real audit record.
export interface PaidRequestAudit {
  scope: string;
  hashedKey: string;
  provider: string;
  model: string;
  outcome: "success" | "blocked" | "failed";
  reason?: string;
  durationMs?: number;
}

export function auditPaidRequest(entry: PaidRequestAudit): void {
  console.log(
    JSON.stringify({
      type: "paid_request_audit",
      timestamp: new Date().toISOString(),
      ...entry,
    })
  );
}
