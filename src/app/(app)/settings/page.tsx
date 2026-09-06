"use client"

import { useRef, useState } from "react"
import {
  DEFAULT_CATEGORIES,
  birthYearsFor,
  seasonLabel,
  sortCategories,
} from "@/lib/domain/categories"
import { reviveState, useApp } from "@/lib/store"
import { Button, Card, PageHeader } from "@/components/ui"
import type { Category, Structure } from "@/lib/types"

export default function SettingsPage() {
  const { t, state, update, reset, replaceState } = useApp()
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const categories = sortCategories(state.categories)
  const perCommunity = state.structure === "communities"

  function switchStructure(structure: Structure) {
    if (structure === state.structure) return
    // Die beiden Modelle lesen dieselbe Datei unterschiedlich, darum ist ein
    // Weiterverwenden der bereits eingelesenen Mitglieder nur irrefuehrend.
    update({
      structure,
      members: [],
      sources: [],
      verifyMembers: null,
      verifySources: [],
      worklistProgress: {},
      overrides: {},
    })
  }

  function patchCategory(id: string, patch: Partial<Category>) {
    update((prev) => ({
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `fcwb-sicherung-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function restoreBackup(file: File | undefined) {
    if (!file) return
    try {
      const revived = reviveState(JSON.parse(await file.text()))
      if (!revived) throw new Error("invalid")
      replaceState(revived)
      setMessage({ tone: "ok", text: t("settings.restored") })
    } catch {
      setMessage({ tone: "bad", text: t("settings.restoreFailed") })
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <>
      <PageHeader title={t("settings.title")} />

      <div className="space-y-6">
        <Card>
          <h2 className="text-base font-semibold">{t("settings.structure")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t("settings.structureLead")}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  value: "communities" as const,
                  label: t("settings.structureCommunities"),
                  hint: t("settings.structureCommunitiesHint"),
                },
                {
                  value: "groups" as const,
                  label: t("settings.structureGroups"),
                  hint: t("settings.structureGroupsHint"),
                },
              ]
            ).map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                  state.structure === option.value
                    ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="structure"
                  checked={state.structure === option.value}
                  onChange={() => switchStructure(option.value)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {state.members.length > 0 ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
              {t("settings.structureWarning")}
            </p>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-base font-semibold">{t("settings.categories")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t("settings.categoriesLead", { season: seasonLabel(state.season) })}
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            {t("settings.disclaimer")}
          </p>

          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto_auto_2fr] sm:items-end dark:border-slate-800"
              >
                <label className="text-xs">
                  <span className="block text-slate-600 dark:text-slate-400">
                    {t("settings.categoryName")}
                  </span>
                  <input
                    value={category.name}
                    onChange={(e) => patchCategory(category.id, { name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="text-xs">
                  <span className="block text-slate-600 dark:text-slate-400">
                    {t("settings.ageFrom")}
                  </span>
                  <input
                    type="number"
                    value={category.minAge}
                    onChange={(e) =>
                      patchCategory(category.id, { minAge: Number(e.target.value) || 0 })
                    }
                    className="tnum mt-1 w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="text-xs">
                  <span className="block text-slate-600 dark:text-slate-400">
                    {t("settings.ageTo")}
                  </span>
                  <input
                    type="number"
                    value={category.maxAge ?? ""}
                    onChange={(e) =>
                      patchCategory(category.id, {
                        maxAge: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="tnum mt-1 w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="text-xs">
                  <span className="block text-slate-600 dark:text-slate-400">
                    {perCommunity ? t("settings.communities") : t("settings.groups")}
                    <span className="tnum ml-2 text-slate-400">
                      {t("settings.years")}: {birthYearsFor(category, state.season).join(", ")}
                    </span>
                  </span>
                  <input
                    value={category.gumbGroups.join(", ")}
                    onChange={(e) =>
                      patchCategory(category.id, {
                        gumbGroups: e.target.value
                          .split(",")
                          .map((g) => g.trim())
                          .filter(Boolean),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs sm:col-span-4">
                  <input
                    type="checkbox"
                    checked={Boolean(category.femaleExtraYear)}
                    onChange={(e) =>
                      patchCategory(category.id, { femaleExtraYear: e.target.checked })
                    }
                    className="h-4 w-4 accent-emerald-600"
                  />
                  {t("settings.femaleExtra")}
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() =>
                update((prev) => ({
                  categories: [
                    ...prev.categories,
                    {
                      id: `c${Date.now().toString(36)}`,
                      name: "",
                      minAge: 0,
                      maxAge: 0,
                      gumbGroups: [],
                    },
                  ],
                }))
              }
            >
              {t("settings.addCategory")}
            </Button>
            <Button onClick={() => update({ categories: DEFAULT_CATEGORIES })}>
              {t("settings.resetCategories")}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">{t("settings.backup")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t("settings.backupLead")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={downloadBackup}>
              {t("settings.download")}
            </Button>
            <Button onClick={() => fileRef.current?.click()}>{t("settings.restore")}</Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => void restoreBackup(e.target.files?.[0])}
            />
          </div>
          {message ? (
            <p
              className={`mt-3 text-sm ${
                message.tone === "ok"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {message.text}
            </p>
          ) : null}
        </Card>

        <Card className="border-rose-200 dark:border-rose-900">
          <h2 className="text-base font-semibold text-rose-800 dark:text-rose-300">
            {t("settings.danger")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t("settings.dangerLead")}
          </p>
          <Button
            variant="danger"
            className="mt-4"
            onClick={() => {
              if (window.confirm(t("settings.dangerConfirm"))) reset()
            }}
          >
            {t("settings.danger")}
          </Button>
        </Card>
      </div>
    </>
  )
}
