import { parseDate } from "../io/mapping.ts"
import type { AttendanceRow } from "../types.ts"
import type { Row, Sheet } from "../io/parse.ts"

export type AttendanceField =
  | "eventId"
  | "date"
  | "start"
  | "end"
  | "firstName"
  | "lastName"
  | "birthDate"
  | "ahv"
  | "status"

export type AttendanceMapping = Partial<Record<AttendanceField, string>>

const CANDIDATES: Record<AttendanceField, string[]> = {
  eventId: ["eventid", "terminid", "anlassid", "id"],
  date: ["datum", "date", "startdatum", "termindatum"],
  start: ["startzeit", "start", "von", "beginn", "starttime"],
  end: ["endzeit", "end", "bis", "ende", "endtime"],
  firstName: ["vorname", "firstname"],
  lastName: ["nachname", "familienname", "lastname", "surname"],
  birthDate: ["geburtsdatum", "geburtstag", "dateofbirth", "birthdate"],
  ahv: ["ahv", "ahvnummer", "ahvn13", "sozialversicherungsnummer"],
  status: ["anwesenheitsstatus", "anwesenheit", "status", "attendance", "teilnahme", "antwort"],
}

function normKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äàâ]/g, "a")
    .replace(/[öô]/g, "o")
    .replace(/[üû]/g, "u")
    .replace(/[éèê]/g, "e")
    .replace(/[^a-z0-9]/g, "")
}

export function guessAttendanceMapping(headers: string[]): AttendanceMapping {
  const mapping: AttendanceMapping = {}
  const used = new Set<string>()
  const norm = headers.map((h) => ({ header: h, key: normKey(h) }))

  for (const field of Object.keys(CANDIDATES) as AttendanceField[]) {
    for (const candidate of CANDIDATES[field]) {
      const exact = norm.find((h) => h.key === candidate && !used.has(h.header))
      if (exact) {
        mapping[field] = exact.header
        used.add(exact.header)
        break
      }
    }
    if (mapping[field]) continue
    for (const candidate of CANDIDATES[field]) {
      const partial = norm.find((h) => h.key.includes(candidate) && !used.has(h.header))
      if (partial) {
        mapping[field] = partial.header
        used.add(partial.header)
        break
      }
    }
  }
  return mapping
}

/**
 * Welche Antwort-Texte zaehlen als "anwesend"? Gumb erlaubt eigene
 * Antwortmoeglichkeiten, darum wird grosszuegig gematcht und im Zweifel
 * als abwesend gewertet (zu viel melden ist bei J+S schlimmer als zu wenig).
 */
const PRESENT_TOKENS = ["anwesend", "ja", "zugesagt", "present", "yes", "da", "teilgenommen", "x", "1"]

export function isPresent(status: string): boolean {
  const v = normKey(status)
  if (!v) return false
  return PRESENT_TOKENS.some((t) => v === t || v.startsWith(t))
}

export function rowsToAttendance(sheet: Sheet, mapping: AttendanceMapping): AttendanceRow[] {
  const get = (row: Row, field: AttendanceField): string => {
    const column = mapping[field]
    return column ? (row[column] ?? "").trim() : ""
  }

  return sheet.rows.map((row, index) => {
    const status = get(row, "status")
    const date = parseDate(get(row, "date"))
    const birth = parseDate(get(row, "birthDate"))
    return {
      // Ohne Event-ID gruppieren wir nach Datum+Startzeit, sonst faellt alles
      // in einen Topf und die Mindestteilnehmer-Pruefung wird sinnlos.
      eventId: get(row, "eventId") || `${date.iso ?? "?"}#${get(row, "start") || index}`,
      date: date.iso,
      start: get(row, "start") || undefined,
      end: get(row, "end") || undefined,
      firstName: get(row, "firstName"),
      lastName: get(row, "lastName"),
      birthDate: birth.iso,
      ahv: get(row, "ahv") || undefined,
      status,
      present: isPresent(status),
      raw: row,
    }
  })
}
