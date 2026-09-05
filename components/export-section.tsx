"use client"

import * as React from "react"
import { ChevronDown, Download, FileDown, Table2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  PLATFORMS,
  buildCsv,
  buildExcludedCsv,
  getExportPreview,
  getFieldMapping,
  type Platform,
} from "@/lib/export"
import type { ProcessedRow } from "@/lib/types"

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ExportSection({ rows }: { rows: ProcessedRow[] }) {
  const [platform, setPlatform] = React.useState<Platform>("customerio")
  const [mappingOpen, setMappingOpen] = React.useState(false)

  const preview = React.useMemo(() => getExportPreview(platform, rows), [platform, rows])
  const mapping = React.useMemo(() => getFieldMapping(platform), [platform])
  const label = PLATFORMS.find((p) => p.id === platform)?.label ?? platform

  const handleExport = () => {
    const csv = buildCsv(platform, rows)
    downloadCsv(`signups_${platform}.csv`, csv)
  }

  const handleExcludedExport = () => {
    const csv = buildExcludedCsv(rows, platform)
    downloadCsv(`signups_${platform}_excluded.csv`, csv)
  }

  return (
    <div className="space-y-4">
      {/* Platform selector */}
      <div className="inline-flex rounded-md border border-border bg-card p-1">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              platform === p.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Preview + actions */}
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm leading-relaxed">{preview.summary}</p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {preview.breakdown.map((b) => (
              <div key={b.label} className="rounded-md border border-border bg-background p-2">
                <div className="font-mono text-lg font-semibold tabular-nums">{b.value}</div>
                <div className="text-[11px] leading-tight text-muted-foreground">{b.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleExport} disabled={preview.exportCount === 0}>
              <Download className="h-4 w-4" />
              Download CRM-ready CSV
            </Button>
            <Button variant="outline" onClick={handleExcludedExport}>
              <FileDown className="h-4 w-4" />
              Download excluded / needs-review rows
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The CRM export contains only clean rows. Needs-Review and junk rows are never dropped
            silently — they download in a separate file so nothing disappears.
          </p>
        </div>

        {/* Field mapping reference */}
        <Collapsible
          open={mappingOpen}
          onOpenChange={setMappingOpen}
          className="rounded-lg border border-border bg-card"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Table2 className="h-4 w-4 text-primary" />
                Field mapping reference
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  mappingOpen && "rotate-180",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border px-4 pb-4 pt-3">
              <p className="mb-2 text-xs text-muted-foreground">
                Canonical field → <span className="font-medium text-foreground">{label}</span>{" "}
                field. Hand this to a CRM admin as-is.
              </p>
              <div className="space-y-1.5">
                {mapping.map((m) => (
                  <div key={m.crmField} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-muted-foreground">{m.canonical}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono font-medium text-foreground">{m.crmField}</span>
                    </div>
                    {m.note && <p className="pl-2 text-[11px] text-muted-foreground">{m.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
