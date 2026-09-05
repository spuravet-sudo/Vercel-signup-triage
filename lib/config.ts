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
