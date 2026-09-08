/**
 * Lightweight, dependency-free industry inference.
 *
 * We derive a best-guess industry from the company name and email domain using
 * (1) a lookup of well-known company domains and (2) keyword matching against
 * the company name / domain. This is heuristic and intended as a sales-routing
 * hint, not a system of record — hence the "Unknown" fallback.
 */

export type Industry =
  | "Software & SaaS"
  | "Financial Services"
  | "Healthcare"
  | "Retail & E-commerce"
  | "Media & Entertainment"
  | "Manufacturing"
  | "Education"
  | "Consulting & Services"
  | "Telecom"
  | "Energy"
  | "Government & Non-profit"
  | "Unknown"

// Known company domains → industry. Keys match on the domain's root label.
const DOMAIN_INDUSTRY: Record<string, Industry> = {
  salesforce: "Software & SaaS",
  microsoft: "Software & SaaS",
  google: "Software & SaaS",
  oracle: "Software & SaaS",
  sap: "Software & SaaS",
  ibm: "Software & SaaS",
  adobe: "Software & SaaS",
  cisco: "Telecom",
  vmware: "Software & SaaS",
  workday: "Software & SaaS",
  servicenow: "Software & SaaS",
  snowflake: "Software & SaaS",
  databricks: "Software & SaaS",
  atlassian: "Software & SaaS",
  hubspot: "Software & SaaS",
  stripe: "Financial Services",
  shopify: "Retail & E-commerce",
  amazon: "Retail & E-commerce",
  nvidia: "Manufacturing",
  intel: "Manufacturing",
  dell: "Manufacturing",
  accenture: "Consulting & Services",
  deloitte: "Consulting & Services",
  jpmorgan: "Financial Services",
  goldmansachs: "Financial Services",
}

// Whole-word keyword → industry. Checked against company name + domain label.
const KEYWORD_INDUSTRY: [RegExp, Industry][] = [
  [/\b(bank|capital|financial|finance|invest|insurance|fintech|payments?|lending|credit)\b/i, "Financial Services"],
  [/\b(health|healthcare|medical|pharma|pharmaceutical|clinic|hospital|biotech|therapeutics?|care)\b/i, "Healthcare"],
  [/\b(retail|shop|store|commerce|ecommerce|market|goods|apparel|brands?)\b/i, "Retail & E-commerce"],
  [/\b(media|entertainment|studios?|games?|gaming|music|film|broadcast|publishing|news)\b/i, "Media & Entertainment"],
  [/\b(manufacturing|industries|industrial|motors?|automotive|hardware|semiconductor|materials?|robotics)\b/i, "Manufacturing"],
  [/\b(university|college|school|academy|education|learning|edu)\b/i, "Education"],
  [/\b(consulting|advisory|partners|solutions|services|agency|labs?)\b/i, "Consulting & Services"],
  [/\b(telecom|wireless|mobile|communications?|networks?|broadband)\b/i, "Telecom"],
  [/\b(energy|power|solar|oil|gas|utilities|electric|renewables?)\b/i, "Energy"],
  [/\b(gov|government|city|county|state|federal|nonprofit|non-profit|foundation|ngo)\b/i, "Government & Non-profit"],
  [/\b(software|saas|cloud|tech|technologies|technology|data|digital|systems?|apps?|platform|ai|cyber|dev)\b/i, "Software & SaaS"],
]

/** Best-effort industry for a company, using its name and email domain. */
export function inferIndustry(companyName: string, emailDomain: string): Industry {
  const domainLabel = emailDomain.split(".")[0]?.toLowerCase() ?? ""
  if (domainLabel && DOMAIN_INDUSTRY[domainLabel]) {
    return DOMAIN_INDUSTRY[domainLabel]
  }

  const haystack = `${companyName} ${domainLabel}`.trim()
  if (!haystack) return "Unknown"

  for (const [pattern, industry] of KEYWORD_INDUSTRY) {
    if (pattern.test(haystack)) return industry
  }

  return "Unknown"
}
