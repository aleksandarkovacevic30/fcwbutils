"use client"

import { useMemo } from "react"
import { computeTransition } from "@/lib/domain/transition"
import { seasonLabel } from "@/lib/domain/categories"
import { guessMapping, rowsToMembers, type ColumnMapping } from "@/lib/io/mapping"
import { mergeMembers, removeCommunity, tagWithCommunity } from "@/lib/io/merge"
import type { Source } from "@/lib/types"
import { useApp } from "@/lib/store"
import { Card, PageHeader } from "@/components/ui"
import { ImportPanel } from "@/components/import-panel"
import { MEMBER_FIELDS } from "@/components/transition/fields"
import { GroupMapper } from "@/components/transition/group-mapper"
import { PlanTable } from "@/components/transition/plan-table"
import { SourceList } from "@/components/transition/sources"
import { Worklist } from "@/components/transition/worklist"
import { VerifyPanel } from "@/components/transition/verify"

export default function TransitionPage() {
  const { t, state, update } = useApp()
  const perCommunity = state.structure === "communities"

  const plan = useMemo(
    () => computeTransition(state.members, state.categories, state.season, state.overrides),
    [state.members, state.categories, state.season, state.overrides],
  )

  const hasMembers = state.members.length > 0

  /**
   * Beim Gemeinschafts-Modell wird jeder Export ergaenzt, nicht ersetzt — die
   * Mitgliederliste entsteht erst aus allen Teams zusammen. Beim Gruppen-Modell
   * ist eine Datei die ganze Wahrheit, dort wird ersetzt.
   */
  function importMembers(
    incoming: ReturnType<typeof rowsToMembers>,
    fileName: string,
    communityName: string,
  ) {
    if (!perCommunity) {
      update({ members: incoming, sources: [], verifyMembers: null, verifySources: [] })
      return
    }

    const tagged = tagWithCommunity(incoming, communityName)
    update((prev) => {
      // Denselben Export nochmals einlesen ersetzt den bisherigen Stand dieser
      // Gemeinschaft, statt die Leute doppelt zu fuehren.
      const base = removeCommunity(prev.members, communityName)
      const source: Source = {
        // Mehrere Dateien landen in derselben Millisekunde — der Zufallsteil
        // verhindert, dass sie dieselbe ID bekommen.
        id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        name: communityName,
        fileName,
        memberCount: tagged.length,
        importedAt: new Date().toISOString(),
      }
      return {
        members: mergeMembers(base, tagged),
        sources: [
          ...prev.sources.filter(
            (s) => s.name.trim().toLowerCase() !== communityName.trim().toLowerCase(),
          ),
          source,
        ],
      }
    })
  }

  function dropSource(source: Source) {
    update((prev) => ({
      members: removeCommunity(prev.members, source.name),
      sources: prev.sources.filter((s) => s.id !== source.id),
    }))
  }

  return (
    <>
      <PageHeader
        title={t("trans.title")}
        lead={t("trans.lead")}
        actions={
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400">{t("trans.season")}</span>
            <input
              type="number"
              value={state.season.startYear}
              min={2000}
              max={2100}
              onChange={(e) =>
                update({ season: { startYear: Number(e.target.value) || state.season.startYear } })
              }
              className="tnum w-24 rounded-lg border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900"
            />
            <span className="tnum text-slate-500 dark:text-slate-400">
              {seasonLabel(state.season)}
            </span>
          </label>
        }
      />

      <div className="space-y-6">
        <ImportPanel<ColumnMapping>
          title={perCommunity ? t("trans.step1Communities") : t("trans.step1")}
          hint={perCommunity ? t("trans.sourcesLead") : t("import.hint")}
          fields={MEMBER_FIELDS}
          guess={guessMapping}
          askCommunityName={perCommunity}
          multiple={perCommunity}
          warning={!perCommunity && hasMembers ? t("import.replaceWarning") : null}
          onApply={(sheet, mapping, communityName) =>
            importMembers(rowsToMembers(sheet, mapping), sheet.fileName, communityName)
          }
        />

        {perCommunity ? (
          <Card className="no-print">
            <h2 className="text-base font-semibold">{t("trans.sources")}</h2>
            <div className="mt-3">
              <SourceList
                sources={state.sources}
                onRemove={dropSource}
                onClear={() => update({ members: [], sources: [] })}
              />
            </div>
          </Card>
        ) : null}

        {hasMembers ? (
          <>
            <GroupMapper />
            <PlanTable items={plan.items} unmanaged={plan.unmanaged.length} />
            <Worklist items={plan.items} />
            <VerifyPanel items={plan.items} />
          </>
        ) : null}
      </div>
    </>
  )
}
