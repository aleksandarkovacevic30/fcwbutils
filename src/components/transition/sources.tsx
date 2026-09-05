"use client"

import type { Source } from "@/lib/types"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui"

/**
 * Beim Modell "eine Gemeinschaft pro Team" speist sich die Mitgliederliste aus
 * mehreren Exporten. Diese Liste zeigt, was bereits drin ist — sonst weiss
 * niemand, ob er das E-Team schon eingelesen hat oder nicht.
 */
export function SourceList({
  sources,
  onRemove,
  onClear,
}: {
  sources: Source[]
  onRemove: (source: Source) => void
  onClear: () => void
}) {
  const { t } = useApp()

  if (sources.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">{t("trans.sourcesEmpty")}</p>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {sources.map((source) => (
          <li key={source.id} className="flex flex-wrap items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{source.name}</span>
              <span className="tnum block text-xs text-slate-500 dark:text-slate-400">
                {t("trans.sourceCount", { n: source.memberCount })} · {source.fileName}
              </span>
            </span>
            <button
              onClick={() => onRemove(source)}
              className="no-print text-xs text-rose-700 hover:underline dark:text-rose-400"
            >
              {t("trans.sourceRemove")}
            </button>
          </li>
        ))}
      </ul>

      {sources.length > 1 ? (
        <Button className="no-print mt-3" onClick={onClear}>
          {t("trans.clearSources")}
        </Button>
      ) : null}
    </div>
  )
}
