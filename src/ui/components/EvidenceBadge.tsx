import { claimLabel } from "../../engine/evidence";
import type { ClaimLevel } from "../../engine/types";

export function EvidenceBadge({ level }: { level: ClaimLevel }) {
  return (
    <span className={`badge badge-${level}`} data-claim-level={level}>
      {claimLabel(level)}
    </span>
  );
}
