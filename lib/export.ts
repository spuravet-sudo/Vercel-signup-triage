import { dataQualityFlags } from "./pipeline"
import type { ProcessedRow } from "./types"

export type Platform = "customerio" | "salesforce" | "snowflake"

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "customerio", label: "Customer.io" },
  { id: "salesforce", label: "Salesforce" },
  { id: "snowflake", label: "Snowflake" },
]

const bool = (v: boolean) => (v ? "TRUE" : "FALSE")

/* -------------------------------------------------------------------------- */
/*  Row partitioning                                                           */
/* -------------------------------------------------------------------------- */

/** A row is held back from every CRM export if it is Needs Review or junk. */
export function isExcludedRow(row: ProcessedRow): boolean {
  return row.enterprise_tier === "Needs Review" || row.is_disposable_or_junk
}

export function partitionRows(rows: ProcessedRow[]): {
  candidates: ProcessedRow[]
  excluded: ProcessedRow[]
} {
  const candidates: ProcessedRow[] = []
  const excluded: ProcessedRow[] = []
  for (const row of rows) {
    if (isExcludedRow(row)) excluded.push(row)
    else candidates.push(row)
  }
  return { candidates, excluded }
}

/* -------------------------------------------------------------------------- */
/*  CSV serialization                                                          */
/* -------------------------------------------------------------------------- */

function csvEscape(value: string | number): string {
  const s = String(value ?? "")
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function toCsv(headers: string[], records: (string | number)[][]): string {
  const lines = [headers.map(csvEscape).join(",")]
  for (const record of records) {
    lines.push(record.map(csvEscape).join(","))
  }
  return lines.join("\r\n")
}

/* -------------------------------------------------------------------------- */
/*  Human-readable data-quality note (used in Salesforce Description)          */
/* -------------------------------------------------------------------------- */

function humanFlagNote(row: ProcessedRow, companyDefaulted: boolean, lastNameDefaulted: boolean): string {
  const parts: string[] = []
  if (lastNameDefaulted) parts.push('last name missing, used "Unknown"')
  if (companyDefaulted) parts.push("company name missing, used email domain as placeholder")
  if (row.is_free_email) parts.push("free/consumer email domain")
  if (row.is_role_based_email) parts.push("role-based inbox")
  if (row.same_account_multiple_signups) parts.push(`same-account multi-signup (team size ~${row.team_size_signal})`)
  if (row.is_duplicate) parts.push(`exact duplicate of row ${row.duplicate_of_row_id}`)
  if (parts.length === 0) return ""
  return `Auto-flagged: ${parts.join("; ")}.`
}

/* -------------------------------------------------------------------------- */
/*  Customer.io                                                                */
/* -------------------------------------------------------------------------- */

export const CUSTOMERIO_HEADERS = [
  "email",
  "first_name",
  "last_name",
  "company_name",
  "company_domain",
  "region",
  "enterprise_tier",
  "enterprise_score",
  "is_free_email",
  "is_duplicate",
  "data_quality_flags",
  "source",
  "ingested_at",
]

function customerIoRecord(row: ProcessedRow): (string | number)[] {
  return [
    row.email,
    row.firstName,
    row.lastName,
    row.companyName,
    row.emailDomain,
    row.region,
    row.enterprise_tier,
    row.enterprise_score,
    bool(row.is_free_email),
    bool(row.is_duplicate),
    dataQualityFlags(row).join("|"),
    row.source,
    row.ingested_at,
  ]
}

/* -------------------------------------------------------------------------- */
/*  Salesforce Lead                                                            */
/* -------------------------------------------------------------------------- */

export const SALESFORCE_HEADERS = [
  "LastName",
  "FirstName",
  "Company",
  "Email",
  "Website",
  "LeadSource",
  "Rating",
  "Description",
]

function salesforceRating(row: ProcessedRow): string {
  switch (row.enterprise_tier) {
    case "Hot":
      return "Hot"
    case "Warm":
      return "Warm"
    case "Low Priority":
      return "Cold"
    default:
      return ""
  }
}

function salesforceRecord(row: ProcessedRow): (string | number)[] {
  const lastNameDefaulted = row.lastName === ""
  const lastName = lastNameDefaulted ? "Unknown" : row.lastName
  const companyDefaulted = row.companyName === ""
  const company = companyDefaulted ? row.emailDomain || "Unknown" : row.companyName
  const note = humanFlagNote(row, companyDefaulted, lastNameDefaulted)
  return [
    lastName,
    row.firstName,
    company,
    row.email,
    row.emailDomain,
    "Self-Serve Signup",
    salesforceRating(row),
    note,
  ]
}

/* -------------------------------------------------------------------------- */
/*  Snowflake staging                                                          */
/* -------------------------------------------------------------------------- */

export const SNOWFLAKE_HEADERS = [
  "EMAIL",
  "FIRST_NAME",
  "LAST_NAME",
  "COMPANY_NAME_RAW",
  "COMPANY_NAME_NORMALIZED",
  "EMAIL_DOMAIN",
  "REGION",
  "IS_FREE_EMAIL",
  "IS_ROLE_BASED_EMAIL",
  "IS_DUPLICATE",
  "DUPLICATE_OF_ROW_ID",
  "ENTERPRISE_SCORE",
  "ENTERPRISE_TIER",
  "DATA_QUALITY_FLAGS",
  "SOURCE",
  "INGESTED_AT",
]

function snowflakeRecord(row: ProcessedRow): (string | number)[] {
  return [
    row.email,
    row.firstName,
    row.lastName,
    row.companyName,
    row.companyNameNormalized,
    row.emailDomain,
    row.region,
    bool(row.is_free_email),
    bool(row.is_role_based_email),
    bool(row.is_duplicate),
    row.duplicate_of_row_id ?? "",
    row.enterprise_score,
    row.enterprise_tier,
    dataQualityFlags(row).join("|"),
    row.source,
    row.ingested_at,
  ]
}

/* -------------------------------------------------------------------------- */
/*  Excluded / needs-review export (canonical shape + reason)                  */
/* -------------------------------------------------------------------------- */

export const EXCLUDED_HEADERS = [
  "row_id",
  "email",
  "first_name",
  "last_name",
  "company_name",
  "region",
  "enterprise_tier",
  "enterprise_score",
  "exclusion_reason",
  "data_quality_flags",
]

function exclusionReason(row: ProcessedRow): string {
  if (row.is_disposable_or_junk) return "Disposable / junk email"
  if (row.enterprise_tier === "Needs Review") return "Needs Review (failed hard-override checks)"
  return "Excluded"
}

function excludedRecord(row: ProcessedRow): (string | number)[] {
  return [
    row.rowId,
    row.email,
    row.firstName,
    row.lastName,
    row.companyName,
    row.region,
    row.enterprise_tier,
    row.enterprise_score,
    exclusionReason(row),
    dataQualityFlags(row).join("|"),
  ]
}

/* -------------------------------------------------------------------------- */
/*  Build full CSV strings                                                     */
/* -------------------------------------------------------------------------- */

export function buildCsv(platform: Platform, rows: ProcessedRow[]): string {
  const { candidates } = partitionRows(rows)
  switch (platform) {
    case "customerio": {
      // Email is the required identifier — skip (and never blank) rows without one.
      const exportable = candidates.filter((r) => r.email !== "")
      return toCsv(CUSTOMERIO_HEADERS, exportable.map(customerIoRecord))
    }
    case "salesforce":
      return toCsv(SALESFORCE_HEADERS, candidates.map(salesforceRecord))
    case "snowflake":
      return toCsv(SNOWFLAKE_HEADERS, candidates.map(snowflakeRecord))
  }
}

export function buildExcludedCsv(rows: ProcessedRow[], platform: Platform): string {
  const { excluded, candidates } = partitionRows(rows)
  const set = [...excluded]
  // Customer.io additionally errors on blank-email candidates — surface them here.
  if (platform === "customerio") {
    set.push(...candidates.filter((r) => r.email === ""))
  }
  set.sort((a, b) => a.rowId - b.rowId)
  return toCsv(EXCLUDED_HEADERS, set.map(excludedRecord))
}

/* -------------------------------------------------------------------------- */
/*  Preview stats                                                              */
/* -------------------------------------------------------------------------- */

export interface ExportPreview {
  platform: Platform
  exportCount: number
  excludedCount: number
  summary: string
  breakdown: { label: string; value: number }[]
}

export function getExportPreview(platform: Platform, rows: ProcessedRow[]): ExportPreview {
  const { candidates, excluded } = partitionRows(rows)

  if (platform === "customerio") {
    const error = candidates.filter((r) => r.email === "").length
    const exportable = candidates.filter((r) => r.email !== "")
    const update = exportable.filter((r) => r.cioId.trim() !== "").length
    const add = exportable.length - update
    return {
      platform,
      exportCount: exportable.length,
      excludedCount: excluded.length,
      summary: `Customer.io: ${add} profiles to add, ${update} to update by existing cio_id if present, ${error} will error. ${excluded.length} rows excluded (Needs Review).`,
      breakdown: [
        { label: "Profiles to add", value: add },
        { label: "Update by cio_id", value: update },
        { label: "Will error (no email)", value: error },
        { label: "Excluded (Needs Review)", value: excluded.length },
      ],
    }
  }

  if (platform === "salesforce") {
    const leads = candidates.length
    const missingCompany = candidates.filter((r) => r.companyName === "").length
    return {
      platform,
      exportCount: leads,
      excludedCount: excluded.length,
      summary: `Salesforce: ${leads} Leads ready. ${missingCompany} rows missing Company — will substitute the email domain as a placeholder Company value per Salesforce's required-field rule, flagged in the Description field for manual review.`,
      breakdown: [
        { label: "Leads ready", value: leads },
        { label: "Company defaulted to domain", value: missingCompany },
        { label: "Excluded (Needs Review)", value: excluded.length },
      ],
    }
  }

  // snowflake
  const load = candidates.length
  return {
    platform,
    exportCount: load,
    excludedCount: excluded.length,
    summary: `Snowflake: ${load} rows will load into CLEAN_SIGNUPS via COPY INTO, 0 rows rejected by file format validation.`,
    breakdown: [
      { label: "Rows load into CLEAN_SIGNUPS", value: load },
      { label: "Rejected by file format", value: 0 },
      { label: "Excluded (Needs Review)", value: excluded.length },
    ],
  }
}

/* -------------------------------------------------------------------------- */
/*  Field mapping reference                                                    */
/* -------------------------------------------------------------------------- */

export interface FieldMap {
  canonical: string
  crmField: string
  note?: string
}

export function getFieldMapping(platform: Platform): FieldMap[] {
  switch (platform) {
    case "customerio":
      return [
        { canonical: "email (normalized)", crmField: "email", note: "Identifier column — always populated, never blank" },
        { canonical: "first_name", crmField: "first_name" },
        { canonical: "last_name", crmField: "last_name" },
        { canonical: "company_name", crmField: "company_name" },
        { canonical: "email_domain", crmField: "company_domain" },
        { canonical: "region", crmField: "region" },
        { canonical: "enterprise_tier", crmField: "enterprise_tier" },
        { canonical: "enterprise_score", crmField: "enterprise_score" },
        { canonical: "is_free_email", crmField: "is_free_email", note: "TRUE / FALSE" },
        { canonical: "is_duplicate", crmField: "is_duplicate", note: "TRUE / FALSE" },
        { canonical: "data quality flags", crmField: "data_quality_flags", note: "Pipe-delimited" },
        { canonical: "source", crmField: "source" },
        { canonical: "ingested_at", crmField: "ingested_at", note: "ISO 8601" },
      ]
    case "salesforce":
      return [
        { canonical: "last_name", crmField: "LastName", note: 'Required — defaults to "Unknown" if blank' },
        { canonical: "first_name", crmField: "FirstName" },
        { canonical: "company_name", crmField: "Company", note: "Required — defaults to email domain if blank" },
        { canonical: "email (normalized)", crmField: "Email" },
        { canonical: "email_domain", crmField: "Website" },
        { canonical: "(static)", crmField: "LeadSource", note: '"Self-Serve Signup"' },
        { canonical: "enterprise_tier", crmField: "Rating", note: "Hot→Hot, Warm→Warm, Low Priority→Cold, Needs Review→blank" },
        { canonical: "data quality flags", crmField: "Description", note: "Plain-English note on any defaulted fields" },
      ]
    case "snowflake":
      return [
        { canonical: "email (normalized)", crmField: "EMAIL" },
        { canonical: "first_name", crmField: "FIRST_NAME" },
        { canonical: "last_name", crmField: "LAST_NAME" },
        { canonical: "company_name", crmField: "COMPANY_NAME_RAW" },
        { canonical: "company_name_normalized", crmField: "COMPANY_NAME_NORMALIZED" },
        { canonical: "email_domain", crmField: "EMAIL_DOMAIN" },
        { canonical: "region", crmField: "REGION" },
        { canonical: "is_free_email", crmField: "IS_FREE_EMAIL", note: "TRUE / FALSE text" },
        { canonical: "is_role_based_email", crmField: "IS_ROLE_BASED_EMAIL", note: "TRUE / FALSE text" },
        { canonical: "is_duplicate", crmField: "IS_DUPLICATE", note: "TRUE / FALSE text" },
        { canonical: "duplicate_of_row_id", crmField: "DUPLICATE_OF_ROW_ID" },
        { canonical: "enterprise_score", crmField: "ENTERPRISE_SCORE" },
        { canonical: "enterprise_tier", crmField: "ENTERPRISE_TIER" },
        { canonical: "data quality flags", crmField: "DATA_QUALITY_FLAGS", note: "Pipe-delimited string" },
        { canonical: "source", crmField: "SOURCE" },
        { canonical: "ingested_at", crmField: "INGESTED_AT" },
      ]
  }
}
