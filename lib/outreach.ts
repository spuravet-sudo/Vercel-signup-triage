import type { ProcessedRow } from "./types"

/* -------------------------------------------------------------------------- */
/*  Sales outreach drafts                                                      */
/*                                                                             */
/*  A three-touch sequence per signup, each a couple of sentences, designed to */
/*  move the prospect down the funnel. Copy is tier-aware: Hot prospects get a */
/*  high-touch, enterprise-oriented sequence (SSO, WAF, Fluid compute, a pilot */
/*  with a solutions engineer); Warm prospects get a lighter self-serve DX      */
/*  sequence (preview deployments, Pro plan). Product references are drawn from */
/*  vercel.com. Needs-Review rows get no drafts until the record is cleaned.    */
/* -------------------------------------------------------------------------- */

const nameOf = (r: ProcessedRow) => r.firstName || "there"
const companyOf = (r: ProcessedRow) => r.companyName || "your team"
const viaEvent = (r: ProcessedRow) => (r.eventName ? ` after connecting at ${r.eventName}` : "")

export function generateOutreach(row: ProcessedRow): string[] {
  const n = nameOf(row)
  const co = companyOf(row)
  const ev = viaEvent(row)

  switch (row.enterprise_tier) {
    case "Hot":
      return [
        `Hi ${n}, thanks for checking out Vercel${ev}. Teams like ${co} come to us to ship Next.js faster without managing infrastructure — worth a quick look at how we'd fit your stack?`,
        `Following up, ${n} — beyond raw speed, Vercel gives ${co} enterprise guardrails out of the box: SSO, a managed WAF, DDoS mitigation, and Fluid compute that absorbs traffic spikes without over-provisioning. Happy to map these to your security and scale requirements.`,
        `${n}, when you're ready I can set up a short pilot for ${co} with one of our solutions engineers — we'll benchmark build times, preview deployments, and total cost against your current setup so the ROI is concrete. Want me to grab 30 minutes this week?`,
      ]
    case "Warm":
      return [
        `Hi ${n}, thanks for signing up${ev}! Vercel is the fastest way to deploy Next.js — push to Git and get a live preview URL for every change. Curious what you're planning to build?`,
        `Hey ${n}, one thing most new users love: every pull request gets its own preview deployment, so ${co} can review real, shareable builds instead of screenshots. Want a quick 15-minute walkthrough of the workflow?`,
        `${n}, if you're evaluating Vercel for ${co}, our Pro plan adds team collaboration, analytics, and higher limits — I can share a trial and a few starter templates to get you going. Interested?`,
      ]
    case "Low Priority":
      return [
        `Hi ${n}, thanks for creating a Vercel account${ev}. Whenever you're ready to deploy, our free Hobby tier gets a Next.js app live in minutes — here are a few templates to start from.`,
        `Hey ${n}, sharing a couple of guides on getting the most out of preview deployments and edge caching — handy as ${co} grows its next project on Vercel.`,
        `${n}, if your usage picks up, our Pro plan unlocks team features and analytics. No rush — just reply anytime and I'll help you find the right fit.`,
      ]
    default:
      // Needs Review — hold outreach until the record is cleaned up.
      return ["", "", ""]
  }
}
