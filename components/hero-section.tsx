import { Filter, Sparkles, Users, Target, Send } from "lucide-react"

const VALUE_PROPS = [
  {
    icon: Sparkles,
    title: "Auto-clean every row",
    body: "Fix casing, normalize emails and regions, and flag junk — no manual spreadsheet grunt work.",
  },
  {
    icon: Users,
    title: "Dedupe & spot teams",
    body: "Merge exact duplicates and surface multiple signups from one company so reps never double-touch.",
  },
  {
    icon: Target,
    title: "Score & prioritize",
    body: "Rank inbound by enterprise fit so sales works the hottest accounts first, not in signup order.",
  },
  {
    icon: Send,
    title: "Export CRM-ready",
    body: "One click to clean files for Customer.io, Salesforce, and Snowflake — mapped and validated.",
  },
]

const METRICS = [
  { value: "Hours → seconds", label: "Manual list cleanup, automated" },
  { value: "100%", label: "Signups scored & deduped" },
  { value: "3 CRMs", label: "Export-ready out of the box" },
]

export function HeroSection() {
  return (
    <header className="relative overflow-hidden border-b border-border">
      {/* subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:44px_44px]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Filter className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Signup Triage</span>
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            Marketing Ops
          </span>
        </div>

        <div className="mt-8 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Stop hand-cleaning signup spreadsheets
          </div>
          <h1 className="mt-5 text-pretty text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Turn messy signups into sales-ready pipeline
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every self-serve signup arrives messy — mixed casing, personal emails, duplicates, and
            no priority. Signup Triage cleans, deduplicates, and scores the whole list in seconds, so
            your team spends time selling to the right accounts instead of fixing CSVs.
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-card px-5 py-4">
              <dt className="text-2xl font-semibold tracking-tight">{m.value}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{m.label}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((prop) => (
            <li
              key={prop.title}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/25"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted">
                <prop.icon className="h-4 w-4 text-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">{prop.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{prop.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
