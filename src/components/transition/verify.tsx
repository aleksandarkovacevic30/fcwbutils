"use client"

import { useMemo } from "react"
import { verifyTransition } from "@/lib/domain/transition"
import { guessMapping, rowsToMembers, type ColumnMapping } from "@/lib/io/mapping"
import { mergeMembers, removeCommunity, tagWithCommunity } from "@/lib/io/merge"
import type { Source, TransitionItem } from "@/lib/types"
import { useApp } from "@/lib/store"
import { Button, Card, Stat } from "@/components/ui"
import { ImportPanel } from "@/components/import-panel"
import { MEMBER_FIELDS } from "@/components/transition/fields"
import { SourceList } from "@/components/transition/sources"

/**
 * Schritt 5: Nach der Handarbeit in Gumb nochmals exportieren und pruefen, ob
 * wirklich jede geplante Verschiebung angekommen ist. Beim Modell "eine
 * Gemeinschaft pro Team" braucht es dafuer wieder alle Team-Exporte.
 */
export function VerifyPanel({ items }: { items: TransitionItem[] }) {
  const { t, state, update } = useApp()
  const perCommunity = state.structure === "communities"

  const result = useMemo(
    () =>
      state.verifyMembers
        ? verifyTransition(items, state.verifyMembers, state.members)
        : null,
    [items, state.verifyMembers, state.members],
  )

  function importVerify(
    incoming: ReturnType<typeof rowsToMembers>,
    fileName: string,
    communityName: string,
  ) {
    if (!perCommunity) {
      update({ verifyMembers: incoming, verifySources: [] })
      return
    }

    const tagged = tagWithCommunity(incoming, communityName)
    update((prev) => {
      const base = removeCommunity(prev.verifyMembers ?? [], communityName)
      const source: Source = {
        // Mehrere Dateien landen in derselben Millisekunde — der Zufallsteil
        // verhindert, dass sie dieselbe ID bekommen.
        id: `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        name: communityName,
        fileName,
        memberCount: tagged.length,
        importedAt: new Date().toISOString(),
      }
      return {
        verifyMembers: mergeMembers(base, tagged),
        verifySources: [
          ...prev.verifySources.filter(
            (s) => s.name.trim().toLowerCase() !== communityName.trim().toLowerCase(),
          ),
          source,
        ],
      }
    })
  }

  // Die Kontrolle ist erst aussagekraeftig, wenn wieder alle Gemeinschaften
  // eingelesen sind — sonst sieht ein angekommenes Kind aus wie ein verlorenes.
  const missingCommunities = perCommunity
    ? state.sources.filter(
        (s) =>
          !state.verifySources.some(
            (v) => v.name.trim().toLowerCase() === s.name.trim().toLowerCase(),
          ),
      )
    : []

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-base font-semibold">{t("trans.step5")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {perCommunity ? t("trans.verifyLeadCommunities") : t("trans.verifyLead")}
          </p>
        </div>
        {state.verifyMembers ? (
          <Button
            className="no-print"
            onClick={() => update({ verifyMembers: null, verifySources: [] })}
          >
            {t("common.close")}
          </Button>
        ) : null}
      </div>

      {!state.verifyMembers || perCommunity ? (
        <div className="mt-4">
          <ImportPanel<ColumnMapping>
            title={t("trans.verifyUpload")}
            hint={perCommunity ? t("trans.sourcesLead") : t("import.hint")}
            fields={MEMBER_FIELDS}
            guess={guessMapping}
            askCommunityName={perCommunity}
            multiple={perCommunity}
            onApply={(sheet, mapping, communityName) =>
              importVerify(rowsToMembers(sheet, mapping), sheet.fileName, communityName)
            }
          />
        </div>
      ) : null}

      {perCommunity && state.verifySources.length > 0 ? (
        <div className="mt-4">
          <SourceList
            sources={state.verifySources}
            onRemove={(source) =>
              update((prev) => ({
                verifyMembers: removeCommunity(prev.verifyMembers ?? [], source.name),
                verifySources: prev.verifySources.filter((s) => s.id !== source.id),
              }))
            }
            onClear={() => update({ verifyMembers: null, verifySources: [] })}
          />
        </div>
      ) : null}

      {missingCommunities.length > 0 ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-300">
          {t("trans.verifyIncomplete", {
            names: missingCommunities.map((s) => s.name).join(", "),
          })}
        </p>
      ) : null}

      {result ? (
        <div className="mt-5">
          {result.missing.length === 0 &&
          result.notFound.length === 0 &&
          missingCommunities.length === 0 ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              {t("trans.verifyPerfect")}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("trans.verifyOk", { n: "" }).trim()} value={result.ok.length} tone="good" />
            <Stat
              label={t("trans.verifyMissing", { n: "" }).trim()}
              value={result.missing.length}
              tone={result.missing.length ? "bad" : undefined}
            />
            <Stat
              label={t("trans.verifyNotFound", { n: "" }).trim()}
              value={result.notFound.length}
              tone={result.notFound.length ? "warn" : undefined}
            />
            <Stat label={t("trans.verifyAdded", { n: "" }).trim()} value={result.added.length} />
          </div>

          {result.missing.length ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">
                {t("trans.verifyMissing", { n: result.missing.length })}
              </h3>
              <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                {result.missing.map(({ item, actualGroups }) => (
                  <li key={item.memberId} className="py-2 text-sm">
                    <span className="font-medium">
                      {item.member.lastName} {item.member.firstName}
                    </span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      {t("trans.actualGroups")}: {actualGroups.join(", ") || "—"} →{" "}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {item.targetGroup}
                      </strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.added.length ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">
                {t("trans.verifyAdded", { n: result.added.length })}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {result.added
                  .slice(0, 20)
                  .map((m) => `${m.lastName} ${m.firstName}`)
                  .join(", ")}
                {result.added.length > 20 ? " …" : ""}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
