/**
 * Editable configuration for the triage pipeline.
 * These are intentionally kept as data (not buried in scoring logic) so an
 * ops teammate can tune the lists without touching the pipeline functions.
 */

// Free / consumer email domains. Exact list per spec.
export const FREE_EMAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "rocketmail.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "gmx.com",
  "gmx.de",
  "web.de",
  "yandex.com",
  "zoho.com",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "hanmail.net",
  "rediffmail.com",
  "inbox.com",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "comcast.net",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
  "cox.net",
  "btinternet.com",
  "virginmedia.com",
  "sky.com",
  "orange.fr",
  "laposte.net",
  "seznam.cz",
  "libero.it",
  "tiscali.it",
  "wp.pl",
  "o2.pl",
]

// Local parts that indicate a shared / role-based inbox rather than a person.
export const ROLE_BASED_LOCAL_PARTS: readonly string[] = [
  "info",
  "sales",
  "support",
  "admin",
  "contact",
  "hello",
  "help",
  "team",
  "office",
  "billing",
  "noreply",
]

// Known throwaway / disposable email domains.
export const DISPOSABLE_DOMAINS: readonly string[] = [
  "mailinator.com",
  "yopmail.com",
  "guerrillamail.com",
  "10minutemail.com",
]

/**
 * Seed list of known enterprise domains. Editable config — add or remove
 * domains here to influence the +25 scoring signal.
 */
export const KNOWN_ENTERPRISE_DOMAINS: readonly string[] = [
  "salesforce.com",
  "microsoft.com",
  "google.com",
  "amazon.com",
  "oracle.com",
  "sap.com",
  "ibm.com",
  "adobe.com",
  "cisco.com",
  "vmware.com",
  "workday.com",
  "servicenow.com",
  "snowflake.com",
  "databricks.com",
  "atlassian.com",
  "hubspot.com",
  "stripe.com",
  "shopify.com",
  "nvidia.com",
  "intel.com",
  "dell.com",
  "accenture.com",
  "deloitte.com",
  "jpmorgan.com",
  "goldmansachs.com",
]

// Whole-word (case-insensitive) tokens in a raw company name that suggest a
// registered / larger organization. Fires the +15 signal.
export const ENTERPRISE_COMPANY_KEYWORDS: readonly string[] = [
  "Inc",
  "Corp",
  "LLC",
  "Ltd",
  "Group",
  "Enterprises",
  "Technologies",
  "Global",
  "Holdings",
  "International",
]

// Legal suffixes stripped when normalizing a company name for matching.
export const LEGAL_SUFFIXES: readonly string[] = [
  "inc",
  "incorporated",
  "llc",
  "l.l.c",
  "corp",
  "corporation",
  "ltd",
  "limited",
  "co",
  "company",
  "gmbh",
  "plc",
  "llp",
  "lp",
  "sa",
  "ag",
  "bv",
  "pty",
  "group",
  "holdings",
]

export const SCORE_THRESHOLDS = {
  hot: 60,
  warm: 30,
} as const

/* -------------------------------------------------------------------------- */
/*  Runtime-editable config                                                    */
/*                                                                             */
/*  The pipeline reads scoring weights and the free / enterprise domain lists  */
/*  from a plain object so the UI can hand a mutated copy back in and recompute */
/*  live — no code change required to tune the rules.                          */
/* -------------------------------------------------------------------------- */

export interface ScoringWeights {
  /** +N when the email is on a real business domain (not free/consumer). */
  businessDomain: number
  /** +N when the email domain is on the known-enterprise seed list. */
  knownEnterpriseDomain: number
  /** +N when the raw company name contains an enterprise keyword. */
  enterpriseKeyword: number
  /** +N when 3+ signups share the same email domain (team signal). */
  multipleSignupsSameDomain: number
  /** -N penalty when the email is a free/consumer domain. */
  freeEmailPenalty: number
  /** -N penalty when the company name is missing. */
  missingCompanyPenalty: number
  /** Score at or above this is "Hot". */
  hotThreshold: number
  /** Score at or above this (but below Hot) is "Warm". */
  warmThreshold: number
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  businessDomain: 30,
  knownEnterpriseDomain: 25,
  enterpriseKeyword: 15,
  multipleSignupsSameDomain: 10,
  freeEmailPenalty: -20,
  missingCompanyPenalty: -15,
  hotThreshold: SCORE_THRESHOLDS.hot,
  warmThreshold: SCORE_THRESHOLDS.warm,
}

export interface TriageConfig {
  weights: ScoringWeights
  freeEmailDomains: string[]
  knownEnterpriseDomains: string[]
}

/** A fresh, deeply-copied default config the UI can safely mutate. */
export function defaultTriageConfig(): TriageConfig {
  return {
    weights: { ...DEFAULT_SCORING_WEIGHTS },
    freeEmailDomains: [...FREE_EMAIL_DOMAINS],
    knownEnterpriseDomains: [...KNOWN_ENTERPRISE_DOMAINS],
  }
}
