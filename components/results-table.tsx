"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown, HelpCircle, Info } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TierBadge } from "@/components/tier-badge"
import { dataQualityFlags } from "@/lib/pipeline"
import { cn } from "@/lib/utils"
import type { EnterpriseTier, ProcessedRow } from "@/lib/types"

type SortKey = "tier" | "score"
type SortDir = "asc" | "desc"

const TIER_RANK: Record<EnterpriseTier, number> = {
  Hot: 3,
  Warm: 2,
  "Low Priority": 1,
  "Needs Review": 0,
}

const FLAG_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All flags" },
  { value: "missing_email", label: "Missing email" },
  { value: "invalid_email_format", label: "Invalid email format" },
  { value: "missing_company", label: "Missing company" },
  { value: "missing_name", label: "Missing name" },
  { value: "is_free_email", label: "Free email" },
  { value: "is_role_based_email", label: "Role-based email" },
  { value: "is_disposable_or_junk", label: "Disposable / junk" },
  { value: "is_duplicate", label: "Exact duplicate" },
  { value: "same_account_multiple_signups", label: "Same-account signup" },
]

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      >
        {label}
        {active ? (
          dir === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  )
}

export function ResultsTable({ rows }: { rows: ProcessedRow[] }) {
  const [sortKey, setSortKey] = React.useState<SortKey>("score")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const [tierFilter, setTierFilter] = React.useState<string>("all")
  const [flagFilter, setFlagFilter] = React.useState<string>("all")

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const filtered = React.useMemo(() => {
    let out = rows
    if (tierFilter !== "all") {
      out = out.filter((r) => r.enterprise_tier === tierFilter)
    }
    if (flagFilter !== "all") {
      out = out.filter((r) => dataQualityFlags(r).includes(flagFilter))
    }
    const sorted = [...out].sort((a, b) => {
      let cmp = 0
      if (sortKey === "score") {
        cmp = a.enterprise_score - b.enterprise_score
        if (cmp === 0) cmp = TIER_RANK[a.enterprise_tier] - TIER_RANK[b.enterprise_tier]
      } else {
        cmp = TIER_RANK[a.enterprise_tier] - TIER_RANK[b.enterprise_tier]
        if (cmp === 0) cmp = a.enterprise_score - b.enterprise_score
      }
      if (cmp === 0) cmp = a.rowId - b.rowId
      return sortDir === "desc" ? -cmp : cmp
    })
    return sorted
  }, [rows, tierFilter, flagFilter, sortKey, sortDir])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tier</span>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="Hot">Hot</SelectItem>
              <SelectItem value="Warm">Warm</SelectItem>
              <SelectItem value="Low Priority">Low Priority</SelectItem>
              <SelectItem value="Needs Review">Needs Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Flag</span>
          <Select value={flagFilter} onValueChange={setFlagFilter}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FLAG_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          Showing <span className="font-mono text-foreground">{filtered.length}</span> of{" "}
          <span className="font-mono text-foreground">{rows.length}</span> rows
        </span>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[60px]">Row</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="w-[90px]">Region</TableHead>
              <SortHeader
                label="Tier"
                active={sortKey === "tier"}
                dir={sortDir}
                onClick={() => toggleSort("tier")}
                className="w-[140px]"
              />
              <SortHeader
                label="Score"
                active={sortKey === "score"}
                dir={sortDir}
                onClick={() => toggleSort("score")}
                className="w-[90px]"
              />
              <TableHead className="w-[60px] text-right">Why</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No rows match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const flags = dataQualityFlags(row)
                return (
                  <TableRow key={row.rowId}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.rowId}
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <span className="block truncate">
                        {row.fullName || <span className="text-muted-foreground">—</span>}
                      </span>
                      {flags.length > 0 && (
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          {flags.slice(0, 2).map((f) => (
                            <span
                              key={f}
                              className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground"
                            >
                              {f}
                            </span>
                          ))}
                          {flags.length > 2 && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              +{flags.length - 2}
                            </span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="block truncate font-mono text-xs">
                        {row.email || <span className="text-review">missing</span>}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <span className="block truncate">
                        {row.companyName || <span className="text-muted-foreground">—</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{row.region}</span>
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={row.enterprise_tier} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn("font-mono text-sm font-semibold tabular-nums", {
                          "text-review": row.enterprise_score < 0,
                        })}
                      >
                        {row.enterprise_score}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`Why this score for row ${row.rowId}`}
                          >
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 border-b border-border pb-2">
                              <Info className="h-4 w-4 text-primary" />
                              <p className="text-sm font-semibold">Why this score?</p>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Final</span>
                              <span className="flex items-center gap-2">
                                <TierBadge tier={row.enterprise_tier} />
                                <span className="font-mono font-semibold">
                                  {row.enterprise_score}
                                </span>
                              </span>
                            </div>
                            <ul className="space-y-1.5">
                              {row.score_reasons.map((reason, i) => (
                                <li
                                  key={i}
                                  className="flex gap-2 text-xs leading-relaxed text-foreground"
                                >
                                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                            {flags.length > 0 && (
                              <div className="border-t border-border pt-2">
                                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                                  Data quality flags
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {flags.map((f) => (
                                    <span
                                      key={f}
                                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                                    >
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
