import type { AttendanceRow, AppState } from "../types.ts"

export type JusSettings = AppState["jus"]

export const DEFAULT_JUS: JusSettings = {
  // J+S verlangt mindestens 3 Teilnehmende (5–20 Jahre, Wohnsitz CH/FL)
  // pro Aktivitaet, damit diese abgerechnet werden kann.
  minParticipants: 3,
  minAge: 5,
  maxAge: 20,
  requireAhv: true,
}

export type Activity = {
  eventId: string
  date?: string
  start?: string
  end?: string
  /** Dauer in Minuten, sofern Start und Ende lesbar sind. */
  minutes?: number
  rows: AttendanceRow[]
  presentCount: number
}

export type Participant = {
  key: string
  firstName: string
  lastName: string
  birthDate?: string
  ahv?: string
  presentCount: number
  listedCount: number
}

export type JusFinding = {
  id: string
  severity: "error" | "warning" | "info"
  ruleKey: string
  /** Direkt anzeigbare Details (Namen, Termine) — nicht uebersetzt. */
  items: string[]
}

function personKey(row: { firstName: string; lastName: string; birthDate?: string }): string {
  return `${row.lastName}|${row.firstName}|${row.birthDate ?? ""}`.toLowerCase()
}

function toMinutes(time?: string): number | undefined {
  if (!time) return undefined
  const m = /^(\d{1,2})[:.](\d{2})/.exec(time.trim())
  if (!m) return undefined
  return Number(m[1]) * 60 + Number(m[2])
}

function ageAt(birthDate: string | undefined, onDate: string | undefined): number | undefined {
  if (!birthDate || !onDate) return undefined
  const b = new Date(birthDate)
  const d = new Date(onDate)
  if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) return undefined
  let age = d.getFullYear() - b.getFullYear()
  const beforeBirthday =
    d.getMonth() < b.getMonth() || (d.getMonth() === b.getMonth() && d.getDate() < b.getDate())
  if (beforeBirthday) age--
  return age
}

export function buildActivities(rows: AttendanceRow[]): Activity[] {
  const map = new Map<string, Activity>()
  for (const row of rows) {
    let activity = map.get(row.eventId)
    if (!activity) {
      const start = toMinutes(row.start)
      const end = toMinutes(row.end)
      activity = {
        eventId: row.eventId,
        date: row.date,
        start: row.start,
        end: row.end,
        minutes: start !== undefined && end !== undefined && end > start ? end - start : undefined,
        rows: [],
        presentCount: 0,
      }
      map.set(row.eventId, activity)
    }
    activity.rows.push(row)
    if (row.present) activity.presentCount++
  }
  return [...map.values()].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
}

export function buildParticipants(rows: AttendanceRow[]): Participant[] {
  const map = new Map<string, Participant>()
  for (const row of rows) {
    const key = personKey(row)
    let p = map.get(key)
    if (!p) {
      p = {
        key,
        firstName: row.firstName,
        lastName: row.lastName,
        birthDate: row.birthDate,
        ahv: row.ahv,
        presentCount: 0,
        listedCount: 0,
      }
      map.set(key, p)
    }
    p.listedCount++
    if (row.present) p.presentCount++
    if (!p.ahv && row.ahv) p.ahv = row.ahv
    if (!p.birthDate && row.birthDate) p.birthDate = row.birthDate
  }
  return [...map.values()].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "de"),
  )
}

/**
 * Pruefungen vor dem Upload in die Nationale Datenbank Sport (NDS).
 * Ziel ist, Rueckweisungen und nicht abrechenbare Aktivitaeten zu finden,
 * solange man sie noch korrigieren kann.
 */
export function checkJus(
  rows: AttendanceRow[],
  activities: Activity[],
  participants: Participant[],
  settings: JusSettings,
): JusFinding[] {
  const findings: JusFinding[] = []

  const tooFew = activities.filter((a) => a.presentCount < settings.minParticipants)
  if (tooFew.length) {
    findings.push({
      id: "min-participants",
      severity: "error",
      ruleKey: "jus.tooFewParticipants",
      items: tooFew.map(
        (a) => `${a.date ?? "?"} ${a.start ?? ""} — ${a.presentCount} ${a.presentCount === 1 ? "" : ""}`.trim(),
      ),
    })
  }

  const noDate = activities.filter((a) => !a.date)
  if (noDate.length) {
    findings.push({
      id: "no-date",
      severity: "error",
      ruleKey: "jus.missingDate",
      items: noDate.map((a) => a.eventId),
    })
  }

  const noTime = activities.filter((a) => a.date && a.minutes === undefined)
  if (noTime.length) {
    findings.push({
      id: "no-time",
      severity: "warning",
      ruleKey: "jus.missingTimes",
      items: noTime.map((a) => `${a.date} (${a.start ?? "?"}–${a.end ?? "?"})`),
    })
  }

  if (settings.requireAhv) {
    const noAhv = participants.filter((p) => !p.ahv)
    if (noAhv.length) {
      findings.push({
        id: "no-ahv",
        severity: "error",
        ruleKey: "jus.missingAhv",
        items: noAhv.map((p) => `${p.firstName} ${p.lastName}`),
      })
    }
  }

  const noBirth = participants.filter((p) => !p.birthDate)
  if (noBirth.length) {
    findings.push({
      id: "no-birth",
      severity: "error",
      ruleKey: "jus.missingBirthDate",
      items: noBirth.map((p) => `${p.firstName} ${p.lastName}`),
    })
  }

  // Altersgrenze zum Zeitpunkt der Aktivitaet, nicht "heute".
  const outOfAge = new Map<string, string>()
  for (const row of rows) {
    if (!row.present) continue
    const age = ageAt(row.birthDate, row.date)
    if (age === undefined) continue
    if (age < settings.minAge || age > settings.maxAge) {
      outOfAge.set(personKey(row), `${row.firstName} ${row.lastName} (${age})`)
    }
  }
  if (outOfAge.size) {
    findings.push({
      id: "age",
      severity: "warning",
      ruleKey: "jus.outsideAgeRange",
      items: [...outOfAge.values()],
    })
  }

  // Zwei Trainings am selben Tag: J+S verguetet nur das laengere.
  const perDay = new Map<string, Map<string, number>>()
  for (const row of rows) {
    if (!row.present || !row.date) continue
    const day = perDay.get(row.date) ?? new Map<string, number>()
    const key = personKey(row)
    day.set(key, (day.get(key) ?? 0) + 1)
    perDay.set(row.date, day)
  }
  const doubles: string[] = []
  for (const [date, day] of perDay) {
    for (const [key, count] of day) {
      if (count > 1) {
        const p = participants.find((x) => x.key === key)
        doubles.push(`${date}: ${p ? `${p.firstName} ${p.lastName}` : key} (${count}×)`)
      }
    }
  }
  if (doubles.length) {
    findings.push({
      id: "same-day",
      severity: "info",
      ruleKey: "jus.multiplePerDay",
      items: doubles.sort(),
    })
  }

  const order: Record<JusFinding["severity"], number> = { error: 0, warning: 1, info: 2 }
  return findings.sort((a, b) => order[a.severity] - order[b.severity])
}
