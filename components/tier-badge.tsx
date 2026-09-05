import { cn } from "@/lib/utils"
import type { EnterpriseTier } from "@/lib/types"

const TIER_STYLES: Record<EnterpriseTier, string> = {
  Hot: "bg-hot/15 text-hot border-hot/30",
  Warm: "bg-warm/15 text-warm border-warm/30",
  "Low Priority": "bg-low/15 text-low-foreground/80 border-low/30",
  "Needs Review": "bg-review/15 text-review border-review/30",
}

export function TierBadge({ tier, className }: { tier: EnterpriseTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        TIER_STYLES[tier],
        className,
      )}
    >
      <span
        className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", {
          "bg-hot": tier === "Hot",
          "bg-warm": tier === "Warm",
          "bg-low-foreground/60": tier === "Low Priority",
          "bg-review": tier === "Needs Review",
        })}
        aria-hidden
      />
      {tier}
    </span>
  )
}
