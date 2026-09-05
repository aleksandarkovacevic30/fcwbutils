import type { Member } from "../types.ts"
import type { Row, Sheet } from "../io/parse.ts"

/** Felder, die die App aus dem Export braucht bzw. gebrauchen kann. */
export type FieldKey =
  | "id"
  | "firstName"
  | "lastName"
  | "fullName"
  | "birthDate"
  | "birthYear"
  | "gender"
  | "email"
  | "phone"
  | "groups"
  | "role"
  | "ahv"

export type ColumnMapping = Partial<Record<FieldKey, string>>

/**
 * Kandidaten fuer die automatische Spaltenerkennung, in Reihenfolge der
 * Praezision. Verglichen wird kleingeschrieben und ohne Sonderzeichen, damit
 * "E-Mail", "E‑Mail-Adresse" und "email" alle treffen.
 */
const CANDIDATES: Record<FieldKey, string[]> = {
  id: ["id", "mitgliedsid", "userid", "gumbid", "memberid", "benutzerid"],
  firstName: ["vorname", "firstname", "givenname", "prenom"],
  lastName: ["nachname", "familienname", "lastname", "surname", "nom"],
  fullName: ["name", "vollstandigername", "fullname", "mitglied"],
  birthDate: ["geburtsdatum", "geburtstag", "dateofbirth", "birthdate", "birthday", "datedenaissance"],
  birthYear: ["jahrgang", "geburtsjahr", "birthyear", "anneedenaissance"],
  gender: ["geschlecht", "gender", "sex"],
  email: ["email", "emailadresse", "mail", "epost"],
  phone: ["telefon", "telefonnummer", "handy", "natel", "mobile", "phone", "mobil"],
  groups: ["gruppen", "gruppe", "groups", "group", "teams", "team", "equipe"],
  role: ["rolle", "role", "berechtigung", "funktion"],
  ahv: ["ahv", "ahvnummer", "ahvn13", "sozialversicherungsnummer", "avs", "numeroavs"],
}

function normKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äàâ]/g, "a")
    .replace(/[öô]/g, "o")
    .replace(/[üû]/g, "u")
    .replace(/[éèê]/g, "e")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "")
}

/** Rät die Spaltenzuordnung aus den Kopfzeilen. */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const used = new Set<string>()
  const norm = headers.map((h) => ({ header: h, key: normKey(h) }))

  for (const field of Object.keys(CANDIDATES) as FieldKey[]) {
    for (const candidate of CANDIDATES[field]) {
      // Erst exakte Treffer, damit "Name" nicht "Vorname" wegschnappt.
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

  // "Name" als Vollname nur verwenden, wenn Vor-/Nachname fehlen.
  if (mapping.firstName && mapping.lastName) delete mapping.fullName
  return mapping
}

/** Parst Schweizer und ISO-Datumsformate sowie Excel-Seriennummern. */
export function parseDate(value: string): { iso?: string; year?: number } {
  const v = value.trim()
  if (!v) return {}

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  if (iso) return { iso: `${iso[1]}-${iso[2]}-${iso[3]}`, year: Number(iso[1]) }

  // 31.12.2016 / 31.12.16 / 31-12-2016 / 31/12/2016
  const swiss = /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/.exec(v)
  if (swiss) {
    const day = swiss[1].padStart(2, "0")
    const month = swiss[2].padStart(2, "0")
    let year = Number(swiss[3])
    if (year < 100) year += year > 30 ? 1900 : 2000
    return { iso: `${year}-${month}-${day}`, year }
  }

  // Reine Jahreszahl
  const yearOnly = /^(19|20)\d{2}$/.exec(v)
  if (yearOnly) return { year: Number(v) }

  // Excel-Seriennummer (Tage seit 1899-12-30)
  const serial = Number(v)
  if (Number.isFinite(serial) && serial > 1000 && serial < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000)
    return {
      iso: date.toISOString().slice(0, 10),
      year: date.getUTCFullYear(),
    }
  }
  return {}
}

function parseGender(value: string): Member["gender"] {
  const v = normKey(value)
  if (!v) return undefined
  if (["w", "f", "weiblich", "female", "frau", "madchen", "juniorin"].includes(v)) return "f"
  if (["m", "mannlich", "male", "mann", "knabe", "junge"].includes(v)) return "m"
  if (["d", "divers", "other", "andere"].includes(v)) return "d"
  return undefined
}

/** Trennt eine Gruppen-Zelle. Gumb schreibt mehrere Gruppen kommagetrennt. */
export function splitGroups(value: string): string[] {
  return value
    .split(/[,;|\n\r/]+/)
    .map((g) => g.trim())
    .filter(Boolean)
}

/** Deterministische ID aus Name + Geburtsdatum, damit zwei Exporte matchen. */
function stableId(parts: string[]): string {
  const input = parts.map(normKey).join("|")
  // FNV-1a — reicht voellig fuer ein paar hundert Mitglieder und ist stabil.
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `m${hash.toString(36)}`
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const trimmed = full.trim()
  // "Muster, Hans" -> Nachname zuerst
  if (trimmed.includes(",")) {
    const [last, first = ""] = trimmed.split(",")
    return { firstName: first.trim(), lastName: last.trim() }
  }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: "", lastName: parts[0] ?? "" }
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] }
}

export function rowsToMembers(sheet: Sheet, mapping: ColumnMapping): Member[] {
  const get = (row: Row, field: FieldKey): string => {
    const column = mapping[field]
    return column ? (row[column] ?? "").trim() : ""
  }

  return sheet.rows.map((row) => {
    let firstName = get(row, "firstName")
    let lastName = get(row, "lastName")
    if (!firstName && !lastName) {
      const split = splitFullName(get(row, "fullName"))
      firstName = split.firstName
      lastName = split.lastName
    }

    const dob = parseDate(get(row, "birthDate"))
    const explicitYear = parseDate(get(row, "birthYear")).year
    const birthYear = dob.year ?? explicitYear

    const externalId = get(row, "id")

    return {
      id: externalId ? `g${normKey(externalId)}` : stableId([lastName, firstName, dob.iso ?? String(birthYear ?? "")]),
      firstName,
      lastName,
      birthDate: dob.iso,
      birthYear,
      gender: parseGender(get(row, "gender")),
      email: get(row, "email") || undefined,
      phone: get(row, "phone") || undefined,
      groups: splitGroups(get(row, "groups")),
      role: get(row, "role") || undefined,
      ahv: get(row, "ahv") || undefined,
      raw: row,
    }
  })
}

/** Alle Gruppennamen, die im Export tatsaechlich vorkommen (fuer die Zuordnung). */
export function collectGroups(members: Member[]): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const m of members) {
    for (const g of m.groups) counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"))
}
