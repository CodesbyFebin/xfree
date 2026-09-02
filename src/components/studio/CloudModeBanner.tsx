import React from "react";
import { Cloud, ShieldCheck } from "lucide-react";

export function CloudModeBanner({ cloud }: { cloud: boolean }) {
  return cloud ? (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
      <Cloud className="mt-0.5 h-4 w-4 shrink-0" />
      <p><strong>Cloud Mode:</strong> messages you submit will be sent to NVIDIA for processing.</p>
    </div>
  ) : (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
      <p><strong>Local Mode:</strong> XFree will not send tool input to NVIDIA.</p>
    </div>
  );
}
