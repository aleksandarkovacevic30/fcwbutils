"use client"

import { useMemo } from "react"
import { bucketByTargetGroup } from "@/lib/domain/transition"
import type { TransitionItem } from "@/lib/types"
import { useApp } from "@/lib/store"
import { Button, Card, PrintButton } from "@/components/ui"

/**
 * Die eigentliche Zeitersparnis: nach Zielgruppe gebuendelt, damit man in Gumb
 * einmal pro Gruppe durch die Mitgliederliste geht statt pro Kind zu suchen.
 */
export function Worklist({ items }: { items: TransitionItem[] }) {
  const { t, state, update } = useApp()
  const perCommunity = state.structure === "communities"
  const buckets = useMemo(() => bucketByTargetGroup(items), [items])

  const moves = useMemo(() => items.filter((i) => i.action === "move"), [items])
  const done = moves.filter((i) => state.worklistProgress[i.memberId]).length

  function toggle(memberId: string) {
    update((prev) => ({
      worklistProgress: {
        ...prev.worklistProgress,
        [memberId]: !prev.worklistProgress[memberId],
      },
    }))
  }

  function toggleBucket(bucketItems: TransitionItem[], value: boolean) {
    update((prev) => {
      const next = { ...prev.worklistProgress }
      for (const item of bucketItems) next[item.memberId] = value
      return { worklistProgress: next }
    })
  }

  if (moves.length === 0) {
    return (
      <Card>
        <h2 className="text-base font-semibold">{t("trans.step4")}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("trans.worklistEmpty")}
        </p>
      </Card>
    )
  }

  const percent = Math.round((done / moves.length) * 100)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t("trans.step4")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {perCommunity ? t("trans.worklistLeadCommunities") : t("trans.worklistLead")}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <PrintButton />
          <Button onClick={() => update({ worklistProgress: {} })}>
            {t("trans.resetProgress")}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={moves.length}
          className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="tnum text-sm font-medium whitespace-nowrap">
          {t("trans.done", { done, total: moves.length })}
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {buckets.map((bucket) => {
          const bucketDone = bucket.items.filter((i) => state.worklistProgress[i.memberId]).length
          const allDone = bucketDone === bucket.items.length
          return (
            <div key={bucket.targetGroup} className="print-block">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                <h3 className="font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">
                    {perCommunity ? t("trans.matrixStep1") : t("trans.add")}{" "}
                  </span>
                  {bucket.targetGroup}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="tnum text-sm text-slate-500 dark:text-slate-400">
                    {bucketDone} {t("common.of")} {bucket.items.length}
                  </span>
                  <button
                    onClick={() => toggleBucket(bucket.items, !allDone)}
                    className="no-print text-xs text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    {allDone ? "↺" : "✓"}
                  </button>
                </div>
              </div>

              <ul className="mt-1">
                {bucket.items.map((item) => {
                  const checked = Boolean(state.worklistProgress[item.memberId])
                  return (
                    <li key={item.memberId}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 py-2 dark:border-slate-800/60 ${
                          checked ? "opacity-50" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(item.memberId)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className={`font-medium ${checked ? "line-through" : ""}`}>
                            {item.member.lastName} {item.member.firstName}
                          </span>
                          <span className="tnum ml-2 text-slate-500 dark:text-slate-400">
                            {item.member.birthYear ?? "—"}
                          </span>
                          {item.removeGroups.length ? (
                            <span className="block text-xs text-rose-700 dark:text-rose-400">
                              {perCommunity ? t("trans.matrixStep2") : t("trans.remove")}{" "}
                              {item.removeGroups.join(", ")}
                            </span>
                          ) : null}
                          {item.needsDecision ? (
                            <span className="block text-xs text-amber-700 dark:text-amber-400">
                              {t("reason.multipleTargetGroups")}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
