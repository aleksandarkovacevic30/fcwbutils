"use client"

import { useMemo } from "react"
import { birthYearsFor, sortCategories } from "@/lib/domain/categories"
import { collectGroups } from "@/lib/io/mapping"
import { useApp } from "@/lib/store"
import { Card } from "@/components/ui"

/**
 * Ordnet die Gruppennamen aus dem Gumb-Export den Alterskategorien zu.
 * Ohne diesen Schritt weiss die App nicht, was "Junioren Eb" bedeutet.
 */
export function GroupMapper() {
  const { t, state, update } = useApp()
  const perCommunity = state.structure === "communities"
  const groups = useMemo(() => collectGroups(state.members), [state.members])
  const categories = useMemo(() => sortCategories(state.categories), [state.categories])

  const categoryOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of state.categories) {
      for (const g of c.gumbGroups) map.set(g.trim().toLowerCase(), c.id)
    }
    return map
  }, [state.categories])

  function assign(groupName: string, categoryId: string) {
    update((prev) => ({
      categories: prev.categories.map((c) => {
        // Erst ueberall entfernen, dann bei der gewaehlten Kategorie anhaengen.
        const without = c.gumbGroups.filter(
          (g) => g.trim().toLowerCase() !== groupName.trim().toLowerCase(),
        )
        return c.id === categoryId ? { ...c, gumbGroups: [...without, groupName] } : { ...c, gumbGroups: without }
      }),
    }))
  }

  const unassignedCount = groups.filter((g) => !categoryOf.has(g.name.trim().toLowerCase())).length

  return (
    <Card className="no-print">
      <h2 className="text-base font-semibold">
        {perCommunity ? t("trans.step2Communities") : t("trans.step2")}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {perCommunity ? t("trans.mapCommunitiesLead") : t("trans.mapGroupsLead")}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {groups.map((group) => {
          const assigned = categoryOf.get(group.name.trim().toLowerCase()) ?? ""
          return (
            <div
              key={group.name}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                assigned
                  ? "border-slate-200 dark:border-slate-800"
                  : "border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium" title={group.name}>
                  {group.name}
                </div>
                <div className="tnum text-xs text-slate-500 dark:text-slate-400">
                  {t("trans.groupCount", { n: group.count })}
                </div>
              </div>
              <select
                value={assigned}
                onChange={(e) => assign(group.name, e.target.value)}
                aria-label={group.name}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">{t("trans.unassigned")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({birthYearsFor(c, state.season).join("/")})
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {unassignedCount > 0 ? (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          {unassignedCount} × {t("trans.unassigned")}
        </p>
      ) : null}
    </Card>
  )
}
