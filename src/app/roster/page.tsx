"use client"

import { useMemo, useState } from "react"
import { checkRoster } from "@/lib/domain/roster"
import { useApp } from "@/lib/store"
import { Card, NeedsData, PageHeader, PrintButton, SeverityBadge, Stat } from "@/components/ui"
import type { Issue, Member } from "@/lib/types"
import type { TranslationKey } from "@/lib/i18n"

export default function RosterPage() {
  const { t, state } = useApp()

  const issues = useMemo(
    () => checkRoster(state.members, state.categories, state.season),
    [state.members, state.categories, state.season],
  )

  const byId = useMemo(
    () => new Map(state.members.map((m) => [m.id, m])),
    [state.members],
  )

  const counts = useMemo(
    () => ({
      error: issues.filter((i) => i.severity === "error").length,
      warning: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
    }),
    [issues],
  )

  if (state.members.length === 0) {
    return (
      <>
        <PageHeader title={t("roster.title")} lead={t("roster.lead")} />
        <NeedsData />
      </>
    )
  }

  return (
    <>
      <PageHeader title={t("roster.title")} lead={t("roster.lead")} actions={<PrintButton />} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("common.members")} value={state.members.length} />
        <Stat label={t("common.error")} value={counts.error} tone={counts.error ? "bad" : "good"} />
        <Stat
          label={t("common.warning")}
          value={counts.warning}
          tone={counts.warning ? "warn" : undefined}
        />
        <Stat label={t("common.info")} value={counts.info} />
      </div>

      {issues.length === 0 ? (
        <Card>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {t("roster.clean")}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} byId={byId} />
          ))}
        </div>
      )}
    </>
  )
}

function IssueCard({ issue, byId }: { issue: Issue; byId: Map<string, Member> }) {
  const { t } = useApp()
  const [expanded, setExpanded] = useState(false)
  const LIMIT = 8
  const members = issue.memberIds
    .map((id) => byId.get(id))
    .filter((m): m is Member => Boolean(m))
  const shown = expanded ? members : members.slice(0, LIMIT)

  return (
    <Card className="print-block">
      <div className="flex flex-wrap items-center gap-3">
        <SeverityBadge severity={issue.severity} />
        <h2 className="flex-1 text-sm font-semibold">{t(issue.ruleKey as TranslationKey)}</h2>
        <span className="tnum text-xs text-slate-500 dark:text-slate-400">
          {t("roster.affected", { n: members.length })}
        </span>
      </div>

      {issue.detail ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{issue.detail}</p>
      ) : null}

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {shown.map((member) => (
          <li key={member.id} className="text-slate-700 dark:text-slate-300">
            {member.lastName} {member.firstName}
            <span className="tnum ml-1 text-xs text-slate-400">{member.birthYear ?? "—"}</span>
          </li>
        ))}
      </ul>

      {members.length > LIMIT ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="no-print mt-2 text-xs text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {expanded ? t("roster.showLess") : t("roster.showAll")}
        </button>
      ) : null}
    </Card>
  )
}
