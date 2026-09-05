"use client"

import { useId, useRef, useState } from "react"
import { parseFile, type Sheet } from "@/lib/io/parse"
import { communityNameFromFile } from "@/lib/io/merge"
import { useApp } from "@/lib/store"
import { Button, Card } from "@/components/ui"
import type { TranslationKey } from "@/lib/i18n"

export type ImportField = {
  key: string
  labelKey: TranslationKey
  /** Ohne mindestens eines der als `required` markierten Felder geht es nicht. */
  required?: boolean
}

type Loaded = {
  sheet: Sheet
  /** Beim Gemeinschafts-Modell: welchem Team dieser Export gehört. */
  name: string
}

export function ImportPanel<M extends Record<string, string | undefined>>({
  title,
  hint,
  fields,
  guess,
  onApply,
  warning,
  askCommunityName,
  multiple,
}: {
  title: string
  hint: string
  fields: ImportField[]
  guess: (headers: string[]) => M
  onApply: (sheet: Sheet, mapping: M, communityName: string) => void
  /** Hinweis, der vor dem Übernehmen angezeigt wird (z.B. "ersetzt die Daten"). */
  warning?: string | null
  /**
   * Beim Modell "eine Gemeinschaft pro Team" muss jede Datei benannt werden —
   * der Name ist die einzige Information darüber, aus welchem Team sie stammt.
   */
  askCommunityName?: boolean
  /**
   * Mehrere Dateien auf einmal. Der Verein hat pro Team eine Gemeinschaft, also
   * fallen bei jedem Saisonwechsel ein Dutzend Exporte an — die will niemand
   * einzeln durchklicken.
   */
  multiple?: boolean
}) {
  const { t } = useApp()
  const [loaded, setLoaded] = useState<Loaded[]>([])
  const [mapping, setMapping] = useState<M | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  function clear() {
    setLoaded([])
    setMapping(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleFiles(files: FileList | null) {
    const list = [...(files ?? [])]
    if (list.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const sheets = await Promise.all(list.map((file) => parseFile(file)))
      setLoaded(
        sheets.map((sheet) => ({ sheet, name: communityNameFromFile(sheet.fileName) })),
      )
      setMapping(guess(sheets[0].headers))
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setError(
        message === "legacy-xls"
          ? t("import.errorLegacy")
          : t("import.errorGeneric", { msg: message }),
      )
      setLoaded([])
      setMapping(null)
    } finally {
      setBusy(false)
    }
  }

  function apply() {
    if (loaded.length === 0 || !mapping) return

    const hasRequired = fields.some((f) => f.required)
    const noneMapped = fields.filter((f) => f.required).every((f) => !mapping[f.key])
    if (hasRequired && noneMapped) {
      setError(t("import.errorNoName"))
      return
    }
    if (askCommunityName && loaded.some((l) => !l.name.trim())) {
      setError(t("import.errorNoCommunity"))
      return
    }
    // Zwei Dateien mit demselben Gemeinschaftsnamen wuerden sich gegenseitig
    // ueberschreiben — das faellt sonst erst am fehlenden Team auf.
    const names = loaded.map((l) => l.name.trim().toLowerCase())
    if (askCommunityName && new Set(names).size !== names.length) {
      setError(t("import.errorDuplicateNames"))
      return
    }

    for (const item of loaded) onApply(item.sheet, mapping, item.name.trim())
    clear()
  }

  // Gumb exportiert alle Gemeinschaften gleich; weichen die Kopfzeilen ab, ist
  // vermutlich eine fremde Datei dabei und die Zuordnung passt dann nicht.
  const reference = loaded[0]?.sheet.headers.join("|")
  const mismatched = loaded.filter((l) => l.sheet.headers.join("|") !== reference)

  return (
    <Card className="no-print">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{hint}</p>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void handleFiles(e.dataTransfer.files)
        }}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragging
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
            : "border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple={multiple}
          accept=".csv,.txt,.xlsx,.xlsm,text/csv"
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <span className="text-sm font-medium">
          {busy ? t("import.reading") : multiple ? t("import.dropMany") : t("import.drop")}
        </span>
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t("import.formats")}
        </span>
      </label>

      {error ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {loaded.length > 0 && mapping ? (
        <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">
              {askCommunityName ? t("trans.communityName") : t("import.files")}
            </h3>
            <span className="tnum text-xs text-slate-500 dark:text-slate-400">
              {t("import.fileCount", { n: loaded.length })}
            </span>
          </div>
          {askCommunityName ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("trans.communityNameHint")}
            </p>
          ) : null}

          <ul className="mt-3 space-y-2">
            {loaded.map((item, index) => (
              <li key={item.sheet.fileName + index} className="flex flex-wrap items-center gap-3">
                {askCommunityName ? (
                  <input
                    value={item.name}
                    aria-label={item.sheet.fileName}
                    onChange={(e) =>
                      setLoaded((prev) =>
                        prev.map((l, i) => (i === index ? { ...l, name: e.target.value } : l)),
                      )
                    }
                    className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                ) : (
                  <span className="text-sm font-medium">{item.sheet.fileName}</span>
                )}
                <span className="tnum text-xs text-slate-500 dark:text-slate-400">
                  {askCommunityName ? `${item.sheet.fileName} · ` : ""}
                  {t("import.rows", {
                    n: item.sheet.rows.length,
                    c: item.sheet.headers.length,
                  })}
                </span>
              </li>
            ))}
          </ul>

          {mismatched.length > 0 ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-300">
              {t("import.headerMismatch", {
                names: mismatched.map((l) => l.sheet.fileName).join(", "),
              })}
            </p>
          ) : null}

          <h3 className="mt-5 text-sm font-semibold">{t("import.mapping")}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("import.mappingHint")}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <label key={field.key} className="text-xs">
                <span className="text-slate-600 dark:text-slate-400">{t(field.labelKey)}</span>
                <select
                  value={mapping[field.key] ?? ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [field.key]: e.target.value || undefined })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">{t("import.none")}</option>
                  {loaded[0].sheet.headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {warning ? (
            <p className="mt-4 text-xs text-amber-700 dark:text-amber-400">{warning}</p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={apply}>
              {t("import.apply")}
            </Button>
            <Button onClick={clear}>{t("common.cancel")}</Button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
