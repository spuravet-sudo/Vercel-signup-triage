"use client"

import * as React from "react"
import { RotateCcw, Settings2, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { defaultTriageConfig } from "@/lib/config"
import type { ScoringWeights, TriageConfig } from "@/lib/config"

const WEIGHT_FIELDS: { key: keyof ScoringWeights; label: string; hint: string }[] = [
  { key: "businessDomain", label: "Business email domain", hint: "Real company domain, not free/consumer" },
  { key: "knownEnterpriseDomain", label: "Known enterprise domain", hint: "On the seed list below" },
  { key: "enterpriseKeyword", label: "Enterprise keyword in company", hint: "e.g. Inc, Corp, Group" },
  { key: "multipleSignupsSameDomain", label: "Multiple signups, same domain", hint: "3+ people from one org" },
  { key: "freeEmailPenalty", label: "Free / consumer email", hint: "Penalty (negative)" },
  { key: "missingCompanyPenalty", label: "Missing company", hint: "Penalty (negative)" },
]

const THRESHOLD_FIELDS: { key: keyof ScoringWeights; label: string }[] = [
  { key: "hotThreshold", label: "Hot at ≥" },
  { key: "warmThreshold", label: "Warm at ≥" },
]

function listToText(list: string[]): string {
  return list.join("\n")
}

function textToList(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\s,]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

export function ScoringConfig({
  config,
  onChange,
}: {
  config: TriageConfig
  onChange: (next: TriageConfig) => void
}) {
  const [open, setOpen] = React.useState(false)
  // Local textarea buffers so typing (including blank lines) stays smooth;
  // the parsed lists are pushed up on change.
  const [freeText, setFreeText] = React.useState(() => listToText(config.freeEmailDomains))
  const [entText, setEntText] = React.useState(() => listToText(config.knownEnterpriseDomains))

  const setWeight = (key: keyof ScoringWeights, value: number) => {
    onChange({ ...config, weights: { ...config.weights, [key]: value } })
  }

  const reset = () => {
    const fresh = defaultTriageConfig()
    setFreeText(listToText(fresh.freeEmailDomains))
    setEntText(listToText(fresh.knownEnterpriseDomains))
    onChange(fresh)
  }

  const isDirty =
    JSON.stringify(config) !== JSON.stringify(defaultTriageConfig())

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-card/40">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
          >
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Scoring config</span>
            <span className="text-xs text-muted-foreground">
              Tune point values and domain lists — recomputes live
            </span>
            {isDirty && (
              <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                edited
              </span>
            )}
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-6 border-t border-border px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Client-side only — nothing is persisted. Edit and watch the summary and table
                update instantly.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                disabled={!isDirty}
                className="h-7 gap-1.5 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Point values
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {WEIGHT_FIELDS.map((f) => (
                  <label key={f.key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium">{f.label}</span>
                    <Input
                      type="number"
                      value={config.weights[f.key]}
                      onChange={(e) => setWeight(f.key, Number(e.target.value) || 0)}
                      className="h-8 font-mono text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground">{f.hint}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tier thresholds
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {THRESHOLD_FIELDS.map((f) => (
                  <label key={f.key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium">{f.label}</span>
                    <Input
                      type="number"
                      value={config.weights[f.key]}
                      onChange={(e) => setWeight(f.key, Number(e.target.value) || 0)}
                      className="h-8 font-mono text-sm"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Free / consumer domains
                  </p>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {config.freeEmailDomains.length}
                  </span>
                </div>
                <Textarea
                  value={freeText}
                  onChange={(e) => {
                    setFreeText(e.target.value)
                    onChange({ ...config, freeEmailDomains: textToList(e.target.value) })
                  }}
                  spellCheck={false}
                  className="h-40 resize-y font-mono text-xs leading-relaxed"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  One domain per line. These get the free-email penalty and are excluded from the
                  business-domain bonus.
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Known enterprise domains
                  </p>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {config.knownEnterpriseDomains.length}
                  </span>
                </div>
                <Textarea
                  value={entText}
                  onChange={(e) => {
                    setEntText(e.target.value)
                    onChange({ ...config, knownEnterpriseDomains: textToList(e.target.value) })
                  }}
                  spellCheck={false}
                  className="h-40 resize-y font-mono text-xs leading-relaxed"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  One domain per line. In production this seed list would be a managed config table
                  or an enrichment API.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
