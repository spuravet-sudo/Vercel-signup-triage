"use client"

import * as React from "react"
import { ChevronDown, ServerCog } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const NOTES: { title: string; body: string }[] = [
  {
    title: "Batch logic moves to a scheduled job",
    body: "This same cleaning + scoring would run as a scheduled reverse-ETL / warehouse job reading from a Snowflake staging table on ingestion — not a browser upload. The upload here is a demo harness around the same pure functions.",
  },
  {
    title: "Domain lists become managed config or enrichment",
    body: "The free-domain and enterprise-seed lists would live in a managed config table or a real enrichment API (Clearbit / ZoomInfo / BuiltWith), or a join against Vercel's own named-account list — versioned and owned by ops, not hard-coded.",
  },
  {
    title: "Dedup runs against the CRM, not just the batch",
    body: "Exact and fuzzy dedup would match against the CRM's existing records (Salesforce Leads/Contacts, Customer.io people), so a returning signup updates the known record instead of creating a near-duplicate.",
  },
  {
    title: "Every export is idempotent",
    body: "Loads would upsert by email (not insert-only) with a stable external id, so re-running the job — after a failure, a config change, or a backfill — is always safe and never double-writes.",
  },
]

export function ProductionNotes() {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-dashed border-border bg-card/30">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-left">
            <ServerCog className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">How this would scale in production</span>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-4 py-4">
            <ul className="grid gap-4 sm:grid-cols-2">
              {NOTES.map((note) => (
                <li key={note.title} className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground">{note.title}</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{note.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
