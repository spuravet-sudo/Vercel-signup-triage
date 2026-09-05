"use client"

import * as React from "react"
import { Database, ListChecks, Upload } from "lucide-react"

import { HeroSection } from "@/components/hero-section"
import { UploadZone } from "@/components/upload-zone"
import { SummaryPanel } from "@/components/summary-panel"
import { ResultsTable } from "@/components/results-table"
import { ExportSection } from "@/components/export-section"
import { ScoringConfig } from "@/components/scoring-config"
import { ProductionNotes } from "@/components/production-notes"
import { computeSummary, runPipeline } from "@/lib/pipeline"
import { defaultTriageConfig } from "@/lib/config"
import type { TriageConfig } from "@/lib/config"
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
  const [config, setConfig] = React.useState<TriageConfig>(defaultTriageConfig)

  const handleData = React.useCallback((rows: RawRow[], name: string) => {
    setRawRows(rows)
    setFileName(name)
  }, [])

  const handleClear = React.useCallback(() => {
    setRawRows(null)
    setFileName(null)
  }, [])

  const processed = React.useMemo(
    () => (rawRows ? runPipeline(rawRows, { source: fileName ?? "upload", config }) : null),
    [rawRows, fileName, config],
  )
  const summary = React.useMemo(
    () => (processed ? computeSummary(processed, config) : null),
    [processed, config],
  )

  return (
    <div>
      <HeroSection />

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <Section
        icon={Upload}
        title="Step 1: Add signup data"
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
            title="Step 2: Data clean up summary"
            description="Counts computed from the cleaning, dedupe, and scoring pipeline."
          >
            <SummaryPanel summary={summary} />
          </Section>

          <Section
            icon={ListChecks}
            title="Step 3: Scored results"
            description="Every row with its tier, score, and the exact reasons behind it. Sort by tier or score, filter by tier or data-quality flag. Expand a row to see raw vs. cleaned values."
          >
            <div className="space-y-3">
              <ScoringConfig config={config} onChange={setConfig} />
              <ResultsTable rows={processed} />
            </div>
          </Section>

          <Section
            icon={Database}
            title="Step 4: CRM export"
            description="Preview and download platform-ready CSVs for Customer.io, Salesforce, and Snowflake."
          >
            <ExportSection rows={processed} />
          </Section>

          <ProductionNotes />
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
    </div>
  )
}
