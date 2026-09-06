"use client"

import { useMemo, useState } from "react"
import { buildActivities, buildParticipants, checkJus } from "@/lib/domain/jus"
import {
  guessAttendanceMapping,
  rowsToAttendance,
  type AttendanceMapping,
} from "@/lib/io/attendance"
import { useApp } from "@/lib/store"
import { Card, PageHeader, PrintButton, SeverityBadge, Stat } from "@/components/ui"
import { ImportPanel } from "@/components/import-panel"
import { ATTENDANCE_FIELDS } from "@/components/transition/fields"
import type { TranslationKey } from "@/lib/i18n"

export default function AttendancePage() {
  const { t, state, update } = useApp()

  const activities = useMemo(() => buildActivities(state.attendance), [state.attendance])
  const participants = useMemo(() => buildParticipants(state.attendance), [state.attendance])
  const findings = useMemo(
    () => checkJus(state.attendance, activities, participants, state.jus),
    [state.attendance, activities, participants, state.jus],
  )

  const presentTotal = state.attendance.filter((r) => r.present).length
  const hasData = state.attendance.length > 0

  return (
    <>
      <PageHeader
        title={t("jus.title")}
        lead={t("jus.lead")}
        actions={hasData ? <PrintButton /> : undefined}
      />

      <div className="space-y-6">
        <ImportPanel<AttendanceMapping>
          title={t("import.title")}
          hint={t("import.attendanceHint")}
          fields={ATTENDANCE_FIELDS}
          guess={guessAttendanceMapping}
          warning={hasData ? t("import.replaceWarning") : null}
          onApply={(sheet, mapping) => update({ attendance: rowsToAttendance(sheet, mapping) })}
        />

        {hasData ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label={t("jus.activities")} value={activities.length} />
              <Stat label={t("jus.participants")} value={participants.length} />
              <Stat label={t("jus.presentTotal")} value={presentTotal} />
            </div>

            <JusSettings />

            {findings.length === 0 ? (
              <Card>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {t("jus.clean")}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    severity={finding.severity}
                    title={t(finding.ruleKey as TranslationKey)}
                    items={finding.items}
                  />
                ))}
              </div>
            )}

            <ParticipantTable participants={participants} total={activities.length} />

            <p className="text-xs text-slate-500 dark:text-slate-400">{t("jus.disclaimer")}</p>
          </>
        ) : null}
      </div>
    </>
  )
}

function JusSettings() {
  const { t, state, update } = useApp()
  return (
    <Card className="no-print">
      <h2 className="text-base font-semibold">{t("jus.settings")}</h2>
      <div className="mt-3 flex flex-wrap items-end gap-5">
        <label className="text-xs">
          <span className="block text-slate-600 dark:text-slate-400">
            {t("jus.minParticipants")}
          </span>
          <input
            type="number"
            min={1}
            value={state.jus.minParticipants}
            onChange={(e) =>
              update((prev) => ({
                jus: { ...prev.jus, minParticipants: Math.max(1, Number(e.target.value) || 1) },
              }))
            }
            className="tnum mt-1 w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        <label className="text-xs">
          <span className="block text-slate-600 dark:text-slate-400">{t("jus.ageRange")}</span>
          <span className="mt-1 flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={state.jus.minAge}
              onChange={(e) =>
                update((prev) => ({ jus: { ...prev.jus, minAge: Number(e.target.value) || 0 } }))
              }
              className="tnum w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <span aria-hidden>–</span>
            <input
              type="number"
              min={0}
              value={state.jus.maxAge}
              onChange={(e) =>
                update((prev) => ({ jus: { ...prev.jus, maxAge: Number(e.target.value) || 0 } }))
              }
              className="tnum w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.jus.requireAhv}
            onChange={(e) =>
              update((prev) => ({ jus: { ...prev.jus, requireAhv: e.target.checked } }))
            }
            className="h-4 w-4 accent-emerald-600"
          />
          {t("jus.requireAhv")}
        </label>
      </div>
    </Card>
  )
}

function FindingCard({
  severity,
  title,
  items,
}: {
  severity: "error" | "warning" | "info"
  title: string
  items: string[]
}) {
  const { t } = useApp()
  const [expanded, setExpanded] = useState(false)
  const LIMIT = 10
  const shown = expanded ? items : items.slice(0, LIMIT)

  return (
    <Card className="print-block">
      <div className="flex flex-wrap items-center gap-3">
        <SeverityBadge severity={severity} />
        <h2 className="flex-1 text-sm font-semibold">{title}</h2>
        <span className="tnum text-xs text-slate-500 dark:text-slate-400">{items.length}</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
        {shown.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
      {items.length > LIMIT ? (
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

function ParticipantTable({
  participants,
  total,
}: {
  participants: ReturnType<typeof buildParticipants>
  total: number
}) {
  const { t } = useApp()
  const [query, setQuery] = useState("")
  const visible = participants.filter((p) =>
    query ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) : true,
  )

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{t("jus.perParticipant")}</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          className="no-print w-40 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2 pr-3 font-medium">{t("common.name")}</th>
              <th className="py-2 pr-3 font-medium">{t("field.birthDate")}</th>
              <th className="py-2 pr-3 font-medium">{t("field.ahv")}</th>
              <th className="py-2 pr-3 text-right font-medium">{t("jus.presentCount")}</th>
              <th className="py-2 text-right font-medium">{t("jus.rate")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const rate = total ? Math.round((p.presentCount / total) * 100) : 0
              return (
                <tr key={p.key} className="border-b border-slate-100 dark:border-slate-800/60">
                  <td className="py-2 pr-3 font-medium">
                    {p.lastName} {p.firstName}
                  </td>
                  <td className="tnum py-2 pr-3 text-slate-600 dark:text-slate-400">
                    {p.birthDate ?? <span className="text-rose-600">—</span>}
                  </td>
                  <td className="tnum py-2 pr-3 text-slate-600 dark:text-slate-400">
                    {p.ahv ?? <span className="text-rose-600">—</span>}
                  </td>
                  <td className="tnum py-2 pr-3 text-right">
                    {p.presentCount} / {total}
                  </td>
                  <td
                    className={`tnum py-2 text-right font-medium ${
                      rate < 50 ? "text-amber-700 dark:text-amber-400" : ""
                    }`}
                  >
                    {rate}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("common.noResults")}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
