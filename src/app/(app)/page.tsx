"use client"

import Link from "next/link"
import { seasonLabel } from "@/lib/domain/categories"
import { useApp } from "@/lib/store"
import { Card, PageHeader } from "@/components/ui"
import type { TranslationKey } from "@/lib/i18n"

const TOOLS: { href: string; titleKey: TranslationKey; descKey: TranslationKey; emoji: string }[] = [
  { href: "/transition", titleKey: "nav.transition", descKey: "home.transitionDesc", emoji: "🔀" },
  { href: "/roster", titleKey: "nav.roster", descKey: "home.rosterDesc", emoji: "🔎" },
  { href: "/attendance", titleKey: "nav.attendance", descKey: "home.attendanceDesc", emoji: "📋" },
]

export default function HomePage() {
  const { t, state } = useApp()

  return (
    <>
      <PageHeader title={t("app.title")} lead={t("home.lead")} />

      <p className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        {t("home.noApi")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card className="h-full transition group-hover:border-emerald-400 group-hover:shadow-md">
              <div aria-hidden className="text-2xl">
                {tool.emoji}
              </div>
              <h2 className="mt-2 text-base font-semibold">{t(tool.titleKey)}</h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {t(tool.descKey)}
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t("home.start")} →
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
          {t("trans.season")} {seasonLabel(state.season)}
        </span>
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
          {state.members.length
            ? t("home.dataLoaded", { n: state.members.length })
            : t("home.noData")}
        </span>
      </div>
    </>
  )
}
