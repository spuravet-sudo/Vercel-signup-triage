"use client"

import * as React from "react"
import { Database, Filter, ListChecks, Upload } from "lucide-react"

import { UploadZone } from "@/components/upload-zone"
import { SummaryPanel } from "@/components/summary-panel"
import { ResultsTable } from "@/components/results-table"
import { ExportSection } from "@/components/export-section"
import { computeSummary, runPipeline } from "@/lib/pipeline"
import type { RawRow } from "@/lib/types"

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function TriageApp() {
  const [rawRows, setRawRows] = React.useState<RawRow[] | null>(null)
  const [fileName, setFileName] = React.useState<string | null>(null)

  const handleData = React.useCallback((rows: RawRow[], name: string) => {
    setRawRows(rows)
    setFileName(name)
  }, [])

  const handleClear = React.useCallback(() => {
    setRawRows(null)
    setFileName(null)
  }, [])

  const processed = React.useMemo(
    () => (rawRows ? runPipeline(rawRows, { source: fileName ?? "upload" }) : null),
    [rawRows, fileName],
  )
  const summary = React.useMemo(
    () => (processed ? computeSummary(processed) : null),
    [processed],
  )

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Filter className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Signup Triage</h1>
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            Marketing Ops
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Clean, deduplicate, and score inbound self-serve signups for ABM follow-up, then export
          CRM-ready files. Everything runs locally in your browser.
        </p>
      </header>

      <Section
        icon={Upload}
        title="1 · Ingest signups"
        description="Upload a messy inbound CSV or load the bundled sample to demo instantly."
      >
        <UploadZone
          onData={handleData}
          onClear={handleClear}
          fileName={fileName}
          rowCount={rawRows?.length ?? 0}
        />
      </Section>

      {processed && summary ? (
        <>
          <Section
            icon={Database}
            title="2 · Triage summary"
            description="Counts computed from the cleaning, dedupe, and scoring pipeline."
          >
            <SummaryPanel summary={summary} />
          </Section>

          <Section
            icon={ListChecks}
            title="3 · Scored results"
            description="Every row with its tier, score, and the exact reasons behind it. Sort by tier or score, filter by tier or data-quality flag."
          >
            <ResultsTable rows={processed} />
          </Section>

          <Section
            icon={Database}
            title="4 · CRM export"
            description="Preview and download platform-ready CSVs for Customer.io, Salesforce, and Snowflake."
          >
            <ExportSection rows={processed} />
          </Section>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Upload a CSV or click{" "}
            <span className="font-medium text-foreground">Load Sample Data</span> to see the triage
            summary, scored results, and CRM export.
          </p>
        </div>
      )}
    </div>
  )
}
