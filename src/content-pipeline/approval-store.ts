import fs from "node:fs";
import path from "node:path";
import { ApprovalLedgerSchema, PublicationApprovalSchema, type PublicationApproval } from "./schemas";

export class ApprovalStore {
  private readonly approvals = new Map<string, PublicationApproval>();

  constructor(private readonly filePath: string) {
    if (!fs.existsSync(filePath)) return;
    const parsed = ApprovalLedgerSchema.safeParse(JSON.parse(fs.readFileSync(filePath, "utf8")));
    if (!parsed.success) throw new Error(`Invalid approval ledger: ${parsed.error.message}`);
    for (const approval of parsed.data.approvals) this.approvals.set(approval.slug, approval);
  }

  get(slug: string): PublicationApproval | undefined {
    return this.approvals.get(slug);
  }

  set(rawApproval: PublicationApproval): void {
    const approval = PublicationApprovalSchema.parse(rawApproval);
    this.approvals.set(approval.slug, approval);
  }

  asMap(): ReadonlyMap<string, PublicationApproval> {
    return this.approvals;
  }

  flush(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify({ version: 1, approvals: [...this.approvals.values()] }, null, 2), { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, this.filePath);
  }
}
