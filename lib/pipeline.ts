import {
  DISPOSABLE_DOMAINS,
  DEFAULT_SCORING_WEIGHTS,
  ENTERPRISE_COMPANY_KEYWORDS,
  FREE_EMAIL_DOMAINS,
  LEGAL_SUFFIXES,
  ROLE_BASED_LOCAL_PARTS,
  defaultTriageConfig,
} from "./config"
import type { ScoringWeights, TriageConfig } from "./config"
import type {
  EnterpriseTier,
  ProcessedRow,
  RawRow,
  Region,
  TriageSummary,
} from "./types"

/* -------------------------------------------------------------------------- */
/*  Field extraction from messy headers                                        */
/* -------------------------------------------------------------------------- */

const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "")

/** Pull the first matching value for any of the candidate header patterns. */
export function pickField(row: RawRow, candidates: string[]): string {
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const target = normalizeKey(candidate)
    // exact normalized match first
    for (const [key, value] of entries) {
      if (normalizeKey(key) === target && value != null && String(value).trim() !== "") {
        return String(value)
      }
    }
  }
  // fall back to "contains"
  for (const candidate of candidates) {
    const target = normalizeKey(candidate)
    for (const [key, value] of entries) {
      if (normalizeKey(key).includes(target) && value != null && String(value).trim() !== "") {
        return String(value)
      }
    }
  }
  return ""
}

/* -------------------------------------------------------------------------- */
/*  Normalization helpers (pure)                                               */
/* -------------------------------------------------------------------------- */

export function normalizeEmail(raw: string): string {
  return (raw ?? "").trim().toLowerCase()
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailFormat(email: string): boolean {
  if (!email) return false
  if (/\s/.test(email)) return false
  if (email.split("@").length !== 2) return false
  return EMAIL_RE.test(email)
}

export function titleCase(raw: string): string {
  const trimmed = (raw ?? "").trim().replace(/\s+/g, " ")
  if (!trimmed) return ""
  return trimmed
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part,
        )
        .join("-"),
    )
    .join(" ")
}

export function getEmailDomain(email: string): string {
  const at = email.lastIndexOf("@")
  return at === -1 ? "" : email.slice(at + 1)
}

export function getEmailLocalPart(email: string): string {
  const at = email.indexOf("@")
  return at === -1 ? email : email.slice(0, at)
}

/** Strip punctuation + common legal suffixes for company matching. */
export function normalizeCompany(raw: string): string {
  let value = (raw ?? "").trim().toLowerCase()
  if (!value) return ""
  value = value.replace(/[.,/#!$%^&*;:{}=\-_`~()@'"?+]/g, " ")
  value = value.replace(/\s+/g, " ").trim()
  let tokens = value.split(" ").filter(Boolean)
  // Repeatedly drop trailing legal suffixes (e.g. "acme inc llc").
  while (tokens.length > 1 && LEGAL_SUFFIXES.includes(tokens[tokens.length - 1])) {
    tokens = tokens.slice(0, -1)
  }
  return tokens.join(" ")
}

/* Region mapping ---------------------------------------------------------- */

const US_STATES = new Set([
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut","delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa","kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan","minnesota","mississippi","missouri","montana","nebraska","nevada","ohio","oklahoma","oregon","pennsylvania","tennessee","texas","utah","vermont","virginia","washington","wisconsin","wyoming",
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia","ks","ky","la","ma","md","me","mi","mn","mo","ms","mt","nc","nd","ne","nh","nj","nm","nv","ny","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","va","vt","wa","wi","wv","wy",
])

const REGION_KEYWORDS: Record<Exclude<Region, "Unknown">, string[]> = {
  NA: ["united states","usa","us","u.s","u.s.a","america","canada","canadian","ca","north america","na"],
  EMEA: ["united kingdom","uk","u.k","england","scotland","wales","ireland","germany","deutschland","france","spain","italy","netherlands","holland","belgium","sweden","norway","denmark","finland","poland","portugal","austria","switzerland","czech","greece","romania","hungary","europe","emea","uae","dubai","saudi","israel","turkey","south africa","nigeria","kenya","egypt","qatar","middle east","africa"],
  APAC: ["australia","new zealand","japan","china","india","singapore","hong kong","south korea","korea","taiwan","thailand","vietnam","malaysia","indonesia","philippines","apac","asia","pacific"],
  LATAM: ["brazil","brasil","mexico","argentina","chile","colombia","peru","venezuela","ecuador","uruguay","bolivia","paraguay","latam","latin america","south america","central america"],
}

export function mapRegion(raw: string): Region {
  const value = (raw ?? "").trim().toLowerCase()
  if (!value) return "Unknown"
  const cleaned = value.replace(/[.,]/g, "").trim()

  // US state names / abbreviations map to NA.
  if (US_STATES.has(cleaned)) return "NA"

  for (const region of Object.keys(REGION_KEYWORDS) as Array<keyof typeof REGION_KEYWORDS>) {
    for (const keyword of REGION_KEYWORDS[region]) {
      if (cleaned === keyword) return region
    }
  }
  for (const region of Object.keys(REGION_KEYWORDS) as Array<keyof typeof REGION_KEYWORDS>) {
    for (const keyword of REGION_KEYWORDS[region]) {
      const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)
      if (re.test(cleaned)) return region
    }
  }
  return "Unknown"
}

/* Email classification ---------------------------------------------------- */

export function isFreeEmailDomain(
  domain: string,
  freeDomains: readonly string[] = FREE_EMAIL_DOMAINS,
): boolean {
  return freeDomains.includes(domain)
}

export function isRoleBasedLocalPart(localPart: string): boolean {
  return ROLE_BASED_LOCAL_PARTS.includes(localPart.toLowerCase())
}

const JUNK_LOCAL_TOKENS = new Set([
  "test","asdf","asdfg","asdfgh","qwer","qwerty","zxcv","wasd","foo","bar","baz","abc","xyz","zzz","aaa","abcd","abcde","temp","fake","none","na","xx","xxx","xxxx","blah","dummy","sample","example","nope","spam",
])

export function isJunkLocalPart(localPart: string): boolean {
  const lp = localPart.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (!lp) return true
  if (JUNK_LOCAL_TOKENS.has(lp)) return true
  // all same character e.g. "aaaa"
  if (lp.length <= 6 && /^(.)\1+$/.test(lp)) return true
  // very short and consonant-only gibberish e.g. "qwr"
  if (lp.length <= 4 && !/[aeiou0-9]/.test(lp)) return true
  return false
}

export function isDisposableOrJunk(email: string, domain: string, localPart: string): boolean {
  if (!email) return false
  if (DISPOSABLE_DOMAINS.includes(domain)) return true
  const domainLabel = domain.split(".")[0] ?? ""
  // test@test.com, asdf@asdf.com style: local part equals the domain label and looks junky
  if (domainLabel && localPart.toLowerCase() === domainLabel.toLowerCase() && isJunkLocalPart(localPart)) {
    return true
  }
  if (isJunkLocalPart(localPart)) return true
  return false
}

/* -------------------------------------------------------------------------- */
/*  Row building                                                               */
/* -------------------------------------------------------------------------- */

const EMAIL_KEYS = ["email", "email address", "work email", "e-mail", "emailaddress", "mail"]
const FIRST_KEYS = ["first name", "firstname", "first", "given name", "fname"]
const LAST_KEYS = ["last name", "lastname", "last", "surname", "family name", "lname"]
const NAME_KEYS = ["full name", "name", "contact name", "fullname"]
const COMPANY_KEYS = ["company", "company name", "organization", "organisation", "org", "account", "employer", "business"]
const REGION_KEYS = ["region", "country", "state", "location", "geo", "market", "territory"]
const CIO_KEYS = ["cio_id", "cioid", "customerio_id", "customer_io_id", "cio", "customerio"]

function countNonBlank(row: ProcessedRow): number {
  const fields = [
    row.email,
    row.firstName,
    row.lastName,
    row.companyName,
    row.regionRaw.trim(),
    row.cioId.trim(),
  ]
  return fields.filter((f) => f && f.trim() !== "").length
}

function buildBaseRow(
  raw: RawRow,
  rowId: number,
  source: string,
  ingestedAt: string,
  config: TriageConfig,
): ProcessedRow {
  const emailRaw = pickField(raw, EMAIL_KEYS)
  let firstNameRaw = pickField(raw, FIRST_KEYS)
  let lastNameRaw = pickField(raw, LAST_KEYS)
  const companyNameRaw = pickField(raw, COMPANY_KEYS)
  const regionRaw = pickField(raw, REGION_KEYS)
  const cioId = pickField(raw, CIO_KEYS)

  // If there's no explicit first/last but a combined name field exists, split it.
  if (!firstNameRaw && !lastNameRaw) {
    const combined = pickField(raw, NAME_KEYS).trim()
    if (combined) {
      const parts = combined.split(/\s+/)
      firstNameRaw = parts[0] ?? ""
      lastNameRaw = parts.length > 1 ? parts.slice(1).join(" ") : ""
    }
  }

  const email = normalizeEmail(emailRaw)
  const emailDomain = getEmailDomain(email)
  const emailLocalPart = getEmailLocalPart(email)
  const firstName = titleCase(firstNameRaw)
  const lastName = titleCase(lastNameRaw)
  const companyName = (companyNameRaw ?? "").trim().replace(/\s+/g, " ")
  const companyNameNormalized = normalizeCompany(companyNameRaw)
  const region = mapRegion(regionRaw)

  const missing_email = email === ""
  const invalid_email_format = !missing_email && !isValidEmailFormat(email)
  const missing_company = companyName === ""
  const missing_name = firstName === "" && lastName === ""

  const is_free_email = !missing_email && isFreeEmailDomain(emailDomain, config.freeEmailDomains)
  const is_role_based_email = !missing_email && isRoleBasedLocalPart(emailLocalPart)
  const is_disposable_or_junk =
    !missing_email && !invalid_email_format
      ? isDisposableOrJunk(email, emailDomain, emailLocalPart)
      : !missing_email
        ? isDisposableOrJunk(email, emailDomain, emailLocalPart)
        : false

  return {
    rowId,
    emailRaw,
    firstNameRaw,
    lastNameRaw,
    companyNameRaw,
    regionRaw,
    cioId,
    email,
    emailDomain,
    emailLocalPart,
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    companyName,
    companyNameNormalized,
    region,
    missing_email,
    invalid_email_format,
    missing_company,
    missing_name,
    is_free_email,
    is_role_based_email,
    is_disposable_or_junk,
    is_duplicate: false,
    duplicate_of_row_id: null,
    same_account_multiple_signups: false,
    team_size_signal: 0,
    enterprise_score: 0,
    enterprise_tier: "Low Priority",
    score_reasons: [],
    source,
    ingested_at: ingestedAt,
  }
}

/* -------------------------------------------------------------------------- */
/*  Scoring                                                                    */
/* -------------------------------------------------------------------------- */

function hasEnterpriseKeyword(companyRaw: string): string | null {
  if (!companyRaw) return null
  for (const keyword of ENTERPRISE_COMPANY_KEYWORDS) {
    const re = new RegExp(`\\b${keyword}\\b`, "i")
    if (re.test(companyRaw)) return keyword
  }
  return null
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

export function scoreRow(
  row: ProcessedRow,
  domainCount: number,
  config: TriageConfig = defaultTriageConfig(),
): void {
  const w = config.weights
  let score = 0
  const reasons: string[] = []

  if (!row.missing_email && !row.invalid_email_format && !row.is_free_email) {
    score += w.businessDomain
    reasons.push(`Business email domain, not a free/consumer provider (${signed(w.businessDomain)})`)
  }

  if (config.knownEnterpriseDomains.includes(row.emailDomain)) {
    score += w.knownEnterpriseDomain
    reasons.push(
      `Email domain "${row.emailDomain}" is a known enterprise domain (${signed(w.knownEnterpriseDomain)})`,
    )
  }

  const keyword = hasEnterpriseKeyword(row.companyNameRaw)
  if (keyword) {
    score += w.enterpriseKeyword
    reasons.push(`Company name contains enterprise signal "${keyword}" (${signed(w.enterpriseKeyword)})`)
  }

  // "2+ other rows share this row's domain" => at least 3 total with this domain.
  if (row.emailDomain && domainCount >= 3) {
    score += w.multipleSignupsSameDomain
    reasons.push(
      `${domainCount} signups share the domain "${row.emailDomain}" — multiple people from one org (${signed(w.multipleSignupsSameDomain)})`,
    )
  }

  if (row.is_free_email) {
    score += w.freeEmailPenalty
    reasons.push(`Free/consumer email domain (${signed(w.freeEmailPenalty)})`)
  }

  if (row.missing_company) {
    score += w.missingCompanyPenalty
    reasons.push(`Company name is missing (${signed(w.missingCompanyPenalty)})`)
  }

  // Hard override
  const missingCount =
    (row.missing_email ? 1 : 0) + (row.missing_company ? 1 : 0) + (row.missing_name ? 1 : 0)
  const forceReview =
    row.is_disposable_or_junk || row.invalid_email_format || missingCount >= 2

  if (forceReview) {
    const overrideReasons: string[] = []
    if (row.is_disposable_or_junk) overrideReasons.push("disposable/junk email")
    if (row.invalid_email_format) overrideReasons.push("invalid email format")
    if (missingCount >= 2) overrideReasons.push("2+ core fields missing")
    row.enterprise_score = 0
    row.enterprise_tier = "Needs Review"
    row.score_reasons = [
      `Forced to Needs Review (score 0): ${overrideReasons.join(", ")}`,
    ]
    return
  }

  row.enterprise_score = score
  row.enterprise_tier = tierForScore(score, w)
  row.score_reasons =
    reasons.length > 0 ? reasons : ["No positive or negative signals fired (base score 0)"]
}

export function tierForScore(
  score: number,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
): EnterpriseTier {
  if (score >= weights.hotThreshold) return "Hot"
  if (score >= weights.warmThreshold) return "Warm"
  return "Low Priority"
}

/* -------------------------------------------------------------------------- */
/*  Full pipeline                                                              */
/* -------------------------------------------------------------------------- */

export interface PipelineOptions {
  source?: string
  ingestedAt?: string
  config?: TriageConfig
}

export function runPipeline(rawRows: RawRow[], options: PipelineOptions = {}): ProcessedRow[] {
  const source = options.source ?? "self-serve-signup"
  const ingestedAt = options.ingestedAt ?? new Date().toISOString()
  const config = options.config ?? defaultTriageConfig()

  const rows = rawRows.map((raw, index) => buildBaseRow(raw, index + 1, source, ingestedAt, config))

  // 1. Exact dedupe by normalized email.
  const byEmail = new Map<string, ProcessedRow[]>()
  for (const row of rows) {
    if (!row.email || row.invalid_email_format) continue
    const group = byEmail.get(row.email) ?? []
    group.push(row)
    byEmail.set(row.email, group)
  }
  for (const group of byEmail.values()) {
    if (group.length < 2) continue
    // keeper = most non-blank fields, tiebreak lowest rowId
    const keeper = [...group].sort((a, b) => {
      const diff = countNonBlank(b) - countNonBlank(a)
      return diff !== 0 ? diff : a.rowId - b.rowId
    })[0]
    for (const row of group) {
      if (row.rowId !== keeper.rowId) {
        row.is_duplicate = true
        row.duplicate_of_row_id = keeper.rowId
      }
    }
  }

  // 2. Domain counts across non-exact-duplicate rows.
  const domainCounts = new Map<string, number>()
  for (const row of rows) {
    if (!row.emailDomain || row.is_duplicate) continue
    domainCounts.set(row.emailDomain, (domainCounts.get(row.emailDomain) ?? 0) + 1)
  }

  // 3. Fuzzy dupes: same normalized domain + normalized company, different email.
  const byAccount = new Map<string, ProcessedRow[]>()
  for (const row of rows) {
    if (row.is_duplicate) continue
    if (!row.emailDomain || !row.companyNameNormalized) continue
    const key = `${row.emailDomain}::${row.companyNameNormalized}`
    const group = byAccount.get(key) ?? []
    group.push(row)
    byAccount.set(key, group)
  }
  for (const group of byAccount.values()) {
    const distinctEmails = new Set(group.map((r) => r.email))
    if (group.length >= 2 && distinctEmails.size >= 2) {
      for (const row of group) {
        row.same_account_multiple_signups = true
        row.team_size_signal = group.length
      }
    }
  }

  // 4. Score.
  for (const row of rows) {
    const domainCount = row.emailDomain ? (domainCounts.get(row.emailDomain) ?? 0) : 0
    scoreRow(row, domainCount, config)
  }

  return rows
}

export function computeSummary(
  rows: ProcessedRow[],
  config: TriageConfig = defaultTriageConfig(),
): TriageSummary {
  const summary: TriageSummary = {
    totalRows: rows.length,
    validRows: 0,
    missingEmail: 0,
    missingCompany: 0,
    missingName: 0,
    invalidEmail: 0,
    freeEmail: 0,
    enterpriseDomainMatch: 0,
    exactDuplicates: 0,
    fuzzyDuplicates: 0,
    disposableJunk: 0,
    tiers: { Hot: 0, Warm: 0, "Low Priority": 0, "Needs Review": 0 },
  }

  for (const row of rows) {
    if (!row.missing_email && !row.invalid_email_format && !row.is_disposable_or_junk) {
      summary.validRows += 1
    }
    if (row.missing_email) summary.missingEmail += 1
    if (row.missing_company) summary.missingCompany += 1
    if (row.missing_name) summary.missingName += 1
    if (row.invalid_email_format) summary.invalidEmail += 1
    if (row.is_free_email) summary.freeEmail += 1
    if (config.knownEnterpriseDomains.includes(row.emailDomain)) summary.enterpriseDomainMatch += 1
    if (row.is_duplicate) summary.exactDuplicates += 1
    if (row.same_account_multiple_signups) summary.fuzzyDuplicates += 1
    if (row.is_disposable_or_junk) summary.disposableJunk += 1
    summary.tiers[row.enterprise_tier] += 1
  }

  return summary
}

/* -------------------------------------------------------------------------- */
/*  Cleaning diff + audit log (lineage / debugging output)                     */
/* -------------------------------------------------------------------------- */

export interface CleaningDiffField {
  field: string
  raw: string
  cleaned: string
  changed: boolean
}

/** The before/after of the normalization step for the reviewer-facing diff. */
export function cleaningDiff(row: ProcessedRow): CleaningDiffField[] {
  const fields: CleaningDiffField[] = [
    { field: "company", raw: row.companyNameRaw ?? "", cleaned: row.companyName },
    { field: "company (match key)", raw: row.companyNameRaw ?? "", cleaned: row.companyNameNormalized },
    { field: "email", raw: row.emailRaw ?? "", cleaned: row.email },
    { field: "region", raw: row.regionRaw ?? "", cleaned: row.region },
    {
      field: "name",
      raw: [row.firstNameRaw, row.lastNameRaw].filter(Boolean).join(" "),
      cleaned: row.fullName,
    },
  ].map((f) => ({ ...f, changed: (f.raw ?? "").trim() !== (f.cleaned ?? "").trim() }))
  return fields
}

export interface AuditLogEntry {
  raw_row_id: number
  ingested_at: string
  source: string
  raw: {
    email: string
    first_name: string
    last_name: string
    company: string
    region: string
    cio_id: string
  }
  cleaned: {
    email: string
    email_domain: string
    full_name: string
    company: string
    company_match_key: string
    region: Region
  }
  enterprise_score: number
  enterprise_tier: EnterpriseTier
  score_reasons: string[]
  data_quality_flags: string[]
  duplicate: {
    is_exact_duplicate: boolean
    duplicate_of_raw_row_id: number | null
    same_account_multiple_signups: boolean
    team_size_signal: number
  }
}

/**
 * Per-row lineage record. In production this is what you'd persist to a
 * warehouse audit table so any downstream number is fully explainable and a
 * bad export can be traced back to its raw input — not just the clean output.
 */
export function buildAuditLog(rows: ProcessedRow[]): AuditLogEntry[] {
  return rows.map((row) => ({
    raw_row_id: row.rowId,
    ingested_at: row.ingested_at,
    source: row.source,
    raw: {
      email: row.emailRaw ?? "",
      first_name: row.firstNameRaw ?? "",
      last_name: row.lastNameRaw ?? "",
      company: row.companyNameRaw ?? "",
      region: row.regionRaw ?? "",
      cio_id: row.cioId ?? "",
    },
    cleaned: {
      email: row.email,
      email_domain: row.emailDomain,
      full_name: row.fullName,
      company: row.companyName,
      company_match_key: row.companyNameNormalized,
      region: row.region,
    },
    enterprise_score: row.enterprise_score,
    enterprise_tier: row.enterprise_tier,
    score_reasons: row.score_reasons,
    data_quality_flags: dataQualityFlags(row),
    duplicate: {
      is_exact_duplicate: row.is_duplicate,
      duplicate_of_raw_row_id: row.duplicate_of_row_id,
      same_account_multiple_signups: row.same_account_multiple_signups,
      team_size_signal: row.team_size_signal,
    },
  }))
}

/** Human-readable data-quality flags for a row. */
export function dataQualityFlags(row: ProcessedRow): string[] {
  const flags: string[] = []
  if (row.missing_email) flags.push("missing_email")
  if (row.invalid_email_format) flags.push("invalid_email_format")
  if (row.missing_company) flags.push("missing_company")
  if (row.missing_name) flags.push("missing_name")
  if (row.is_free_email) flags.push("is_free_email")
  if (row.is_role_based_email) flags.push("is_role_based_email")
  if (row.is_disposable_or_junk) flags.push("is_disposable_or_junk")
  if (row.is_duplicate) flags.push("is_duplicate")
  if (row.same_account_multiple_signups) flags.push("same_account_multiple_signups")
  return flags
}
