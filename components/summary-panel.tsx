import { cn } from "@/lib/utils"
import type { TriageSummary } from "@/lib/types"

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: number
  hint?: string
  accent?: "hot" | "warm" | "low" | "review" | "primary"
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn("font-mono text-2xl font-semibold tabular-nums", {
            "text-hot": accent === "hot",
            "text-warm": accent === "warm",
            "text-muted-foreground": accent === "low",
            "text-review": accent === "review",
            "text-primary": accent === "primary",
          })}
        >
          {value.toLocaleString()}
        </span>
      </div>
      <p className="mt-1 text-xs font-medium text-foreground">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function SummaryPanel({ summary }: { summary: TriageSummary }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tier breakdown
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Hot" value={summary.tiers.Hot} accent="hot" hint="Score ≥ 60" />
          <Stat label="Warm" value={summary.tiers.Warm} accent="warm" hint="Score 30–59" />
          <Stat label="Low Priority" value={summary.tiers["Low Priority"]} accent="low" hint="Score < 30" />
          <Stat label="Needs Review" value={summary.tiers["Needs Review"]} accent="review" hint="Hard override" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ingestion &amp; data quality
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Total rows ingested" value={summary.totalRows} accent="primary" />
          <Stat label="Valid rows" value={summary.validRows} hint="Valid email, not junk" />
          <Stat label="Free-email domains" value={summary.freeEmail} />
          <Stat label="Enterprise-domain matches" value={summary.enterpriseDomainMatch} hint="High-value" />
          <Stat label="Disposable / junk excluded" value={summary.disposableJunk} accent="review" />
          <Stat label="Missing email" value={summary.missingEmail} />
          <Stat label="Invalid email format" value={summary.invalidEmail} />
          <Stat label="Missing company" value={summary.missingCompany} />
          <Stat label="Missing name" value={summary.missingName} />
          <Stat label="Exact duplicates" value={summary.exactDuplicates} hint="Same normalized email" />
          <Stat
            label="Same-account signups"
            value={summary.fuzzyDuplicates}
            hint="Same domain + company"
          />
        </div>
      </div>
    </div>
  )
}
