"use client"

import { useMemo, useState } from "react"
import { SKIP, STAY, type TransitionAction, type TransitionItem } from "@/lib/types"
import { useApp } from "@/lib/store"
import { Button, Card } from "@/components/ui"
import type { TranslationKey } from "@/lib/i18n"

const ACTION_STYLES: Record<TransitionAction, string> = {
  move: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  stay: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  graduate: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-300",
  review: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
}

const FILTERS: (TransitionAction | "all")[] = ["all", "move", "review", "graduate", "stay"]

export function PlanTable({ items, unmanaged }: { items: TransitionItem[]; unmanaged: number }) {
  const { t, state, update } = useApp()
  const [filter, setFilter] = useState<TransitionAction | "all">("move")
  const [query, setQuery] = useState("")

  const counts = useMemo(() => {
    const base: Record<TransitionAction, number> = { move: 0, stay: 0, graduate: 0, review: 0 }
    for (const item of items) base[item.action]++
    return base
  }, [items])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((item) => filter === "all" || item.action === filter)
      .filter((item) =>
        q
          ? `${item.member.firstName} ${item.member.lastName}`.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) =>
        `${a.member.lastName} ${a.member.firstName}`.localeCompare(
          `${b.member.lastName} ${b.member.firstName}`,
          "de",
        ),
      )
  }, [items, filter, query])

  function setOverride(memberId: string, value: string) {
    update((prev) => {
      const next = { ...prev.overrides }
      if (!value) delete next[memberId]
      else next[memberId] = value
      return { overrides: next }
    })
  }

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">{t("trans.step3")}</h2>
        <p className="tnum text-sm text-slate-600 dark:text-slate-400">
          {t("trans.planSummary", {
            move: counts.move,
            stay: counts.stay,
            graduate: counts.graduate,
            review: counts.review,
          })}
        </p>
      </div>

      {unmanaged > 0 ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t("trans.unmanaged", { n: unmanaged })}
        </p>
      ) : null}

      <div className="no-print mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-2.5 py-1 text-sm transition ${
              filter === f
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {f === "all" ? "∑" : t(`trans.action.${f}` as TranslationKey)}
            <span className="tnum ml-1.5 opacity-70">
              {f === "all" ? items.length : counts[f]}
            </span>
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          className="ml-auto w-40 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2 pr-3 font-medium">{t("common.name")}</th>
              <th className="py-2 pr-3 font-medium">{t("common.year")}</th>
              <th className="py-2 pr-3 font-medium">{t("common.status")}</th>
              <th className="py-2 pr-3 font-medium">{t("common.group")}</th>
              <th className="no-print py-2 font-medium">{t("trans.override")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr
                key={item.memberId}
                className="border-b border-slate-100 align-top dark:border-slate-800/60"
              >
                <td className="py-2 pr-3">
                  <div className="font-medium">
                    {item.member.lastName} {item.member.firstName}
                  </div>
                  {item.reasons.length ? (
                    <div className="text-xs text-amber-700 dark:text-amber-400">
                      {item.reasons.map((r) => t(r as TranslationKey)).join(" · ")}
                    </div>
                  ) : null}
                </td>
                <td className="tnum py-2 pr-3 text-slate-600 dark:text-slate-400">
                  {item.member.birthYear ?? "—"}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[item.action]}`}
                  >
                    {t(`trans.action.${item.action}` as TranslationKey)}
                  </span>
                </td>
                <td className="py-2 pr-3 text-slate-600 dark:text-slate-400">
                  {item.action === "move" ? (
                    <span>
                      {item.removeGroups.join(", ") || "—"} <span aria-hidden>→</span>{" "}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {item.targetGroup}
                      </strong>
                    </span>
                  ) : (
                    (item.member.groups.join(", ") || "—")
                  )}
                </td>
                <td className="no-print py-2">
                  <select
                    value={state.overrides[item.memberId] ?? ""}
                    onChange={(e) => setOverride(item.memberId, e.target.value)}
                    aria-label={`${item.member.lastName} ${item.member.firstName}`}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">{t("trans.overrideAuto")}</option>
                    <option value={STAY}>{t("trans.overrideStay")}</option>
                    <option value={SKIP}>{t("trans.overrideSkip")}</option>
                    {state.categories.flatMap((c) =>
                      c.gumbGroups.map((g) => (
                        <option key={`${c.id}-${g}`} value={g}>
                          {g}
                        </option>
                      )),
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("common.noResults")}
          </p>
        ) : null}
      </div>

      {Object.keys(state.overrides).length > 0 ? (
        <div className="no-print mt-4">
          <Button onClick={() => update({ overrides: {} })}>
            {t("trans.resetOverrides")} ({Object.keys(state.overrides).length})
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
