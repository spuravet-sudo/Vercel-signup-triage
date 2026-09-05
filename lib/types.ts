export type Region = "NA" | "EMEA" | "APAC" | "LATAM" | "Unknown"

export type EnterpriseTier = "Hot" | "Warm" | "Low Priority" | "Needs Review"

/** A raw, messy row as parsed from an uploaded CSV. Keys are loose. */
export type RawRow = Record<string, string | undefined>

export type DataQualityFlag =
  | "missing_email"
  | "invalid_email_format"
  | "missing_company"
  | "missing_name"
  | "is_free_email"
  | "is_role_based_email"
  | "is_disposable_or_junk"
  | "is_duplicate"
  | "same_account_multiple_signups"

export interface ProcessedRow {
  rowId: number

  // Raw captured values
  emailRaw: string
  firstNameRaw: string
  lastNameRaw: string
  companyNameRaw: string
  regionRaw: string
  cioId: string

  // Normalized values
  email: string
  emailDomain: string
  emailLocalPart: string
  firstName: string
  lastName: string
  fullName: string
  companyName: string
  companyNameNormalized: string
  region: Region

  // Data quality flags
  missing_email: boolean
  invalid_email_format: boolean
  missing_company: boolean
  missing_name: boolean
  is_free_email: boolean
  is_role_based_email: boolean
  is_disposable_or_junk: boolean

  // Dedupe
  is_duplicate: boolean
  duplicate_of_row_id: number | null
  same_account_multiple_signups: boolean
  team_size_signal: number

  // Scoring
  enterprise_score: number
  enterprise_tier: EnterpriseTier
  score_reasons: string[]

  // Provenance
  source: string
  ingested_at: string
}

export interface TriageSummary {
  totalRows: number
  validRows: number
  missingEmail: number
  missingCompany: number
  missingName: number
  invalidEmail: number
  freeEmail: number
  enterpriseDomainMatch: number
  exactDuplicates: number
  fuzzyDuplicates: number
  disposableJunk: number
  tiers: {
    Hot: number
    Warm: number
    "Low Priority": number
    "Needs Review": number
  }
}
