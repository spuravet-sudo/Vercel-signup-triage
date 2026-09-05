import { Sparkles, Users, Target, Send } from "lucide-react"

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

export function HeroSection() {
  return (
    <header className="relative overflow-hidden border-b border-border">
      {/* subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:44px_44px]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-7 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-pretty text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Turn messy signups into sales-ready pipeline
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every self-serve signup arrives messy — mixed casing, personal emails, duplicates, and
            no priority. Signup Triage cleans, deduplicates, and scores the whole list in seconds, so
            your team spends time selling to the right accounts instead of fixing CSVs.
          </p>
        </div>

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
