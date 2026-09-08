"use client"

import * as React from "react"
import Papa from "papaparse"
import { Upload, FileSpreadsheet, Sparkles, Loader2, X, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { RawRow } from "@/lib/types"

interface UploadZoneProps {
  onData: (rows: RawRow[], fileName: string) => void
  fileName: string | null
  rowCount: number
  onClear: () => void
  eventName: string
  onEventNameChange: (value: string) => void
}

export function UploadZone({
  onData,
  fileName,
  rowCount,
  onClear,
  eventName,
  onEventNameChange,
}: UploadZoneProps) {
  const [dragging, setDragging] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const parseFile = React.useCallback(
    (file: File) => {
      setError(null)
      setLoading(true)
      Papa.parse<RawRow>(file, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.trim(),
        complete: (results) => {
          setLoading(false)
          if (!results.data || results.data.length === 0) {
            setError("No rows found in this file.")
            return
          }
          onData(results.data, file.name)
        },
        error: (err) => {
          setLoading(false)
          setError(err.message || "Failed to parse file.")
        },
      })
    },
    [onData],
  )

  const hasEventName = eventName.trim().length > 0

  const handleFiles = React.useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      if (!hasEventName) {
        setError("Enter an event / campaign name before adding signup data.")
        return
      }
      if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
        setError("Please upload a .csv file.")
        return
      }
      parseFile(file)
    },
    [parseFile, hasEventName],
  )

  const loadSample = React.useCallback(async () => {
    if (!hasEventName) {
      setError("Enter an event / campaign name before adding signup data.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/sample-data/signups.csv")
      if (!res.ok) throw new Error("Sample file not found.")
      const text = await res.text()
      const results = Papa.parse<RawRow>(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.trim(),
      })
      setLoading(false)
      onData(results.data, "signups.csv (sample)")
    } catch (e) {
      setLoading(false)
      setError(e instanceof Error ? e.message : "Failed to load sample.")
    }
  }, [onData, hasEventName])

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <label htmlFor="event-name" className="flex items-center gap-1.5 text-sm font-medium">
          <Tag className="h-3.5 w-3.5 text-primary" />
          Event / campaign name
          <span className="font-normal text-destructive">*required</span>
        </label>
        <p className="mb-2 mt-1 text-xs text-muted-foreground">
          A static label stamped onto every row in this batch — e.g. the webinar, conference, or ad
          this list came from. It flows straight through to the CRM exports.
        </p>
        <Input
          id="event-name"
          value={eventName}
          onChange={(e) => onEventNameChange(e.target.value)}
          placeholder="e.g. SaaStr Annual 2026"
          required
          aria-required="true"
          aria-invalid={!hasEventName}
          className="max-w-sm"
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        aria-disabled={!hasEventName}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-5 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
          !hasEventName && "opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Drag &amp; drop a signups CSV, or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!hasEventName}
              className="text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            Messy inbound lists welcome — parsed locally in your browser, nothing is uploaded.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadSample}
            disabled={loading || !hasEventName}
          >
            <Sparkles className="h-4 w-4" />
            Load Sample Data
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {fileName && (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs">{fileName}</span>
            <span className="text-muted-foreground">— {rowCount} rows ingested</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} aria-label="Clear data">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
