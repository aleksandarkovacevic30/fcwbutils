import type { Category, Season } from "../types.ts"

/**
 * Standard-Kategorien nach SFV/FVRZ (gueltig ab Saison 2025/26 landesweit,
 * im FVRZ bereits ab 2024/25).
 *
 * `minAge`/`maxAge` = Alter, das im Kalenderjahr des Saisonstarts erreicht
 * wird. Beispiel Saison 2026/27 (Saisonstartjahr 2026):
 *   Junioren E = Alter 9–10 = Jahrgaenge 2017 und 2016.
 *
 * Diese Tabelle ist ein Startwert, keine Rechtsquelle — sie ist in den
 * Einstellungen frei editierbar und sollte vor jedem Saisonwechsel mit den
 * aktuellen Ausfuehrungsbestimmungen abgeglichen werden.
 */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "g", name: "Junioren G", minAge: 0, maxAge: 6, gumbGroups: ["Junioren G"] },
  { id: "f", name: "Junioren F", minAge: 7, maxAge: 8, gumbGroups: ["Junioren F"] },
  { id: "e", name: "Junioren E", minAge: 9, maxAge: 10, gumbGroups: ["Junioren E"] },
  { id: "d", name: "Junioren D", minAge: 11, maxAge: 12, gumbGroups: ["Junioren D"], femaleExtraYear: true },
  { id: "c", name: "Junioren C", minAge: 13, maxAge: 14, gumbGroups: ["Junioren C"], femaleExtraYear: true },
  { id: "b", name: "Junioren B", minAge: 15, maxAge: 16, gumbGroups: ["Junioren B"], femaleExtraYear: true },
  { id: "a", name: "Junioren A", minAge: 17, maxAge: 18, gumbGroups: ["Junioren A"], femaleExtraYear: true },
]

export function defaultSeason(today = new Date()): Season {
  // Die Schweizer Saison startet im Sommer. Vor Juni planen die Vereine
  // noch die laufende Saison, ab Juni die naechste.
  const year = today.getFullYear()
  return { startYear: today.getMonth() >= 5 ? year : year - 1 }
}

export function seasonLabel(season: Season): string {
  return `${season.startYear}/${String((season.startYear + 1) % 100).padStart(2, "0")}`
}

/** Alter, das ein Jahrgang im Kalenderjahr des Saisonstarts erreicht. */
export function ageInSeason(birthYear: number, season: Season): number {
  return season.startYear - birthYear
}

/** Jahrgaenge, die in dieser Saison zu einer Kategorie gehoeren (neueste zuerst). */
export function birthYearsFor(category: Category, season: Season): number[] {
  const max = category.maxAge ?? category.minAge + 1
  const years: number[] = []
  for (let age = category.minAge; age <= max; age++) years.push(season.startYear - age)
  return years.sort((a, b) => b - a)
}

/**
 * Findet die Kategorie fuer einen Jahrgang. Beruecksichtigt die SFV-Regel,
 * dass Maedchen in D/C/B/A ein Jahr aelter sein duerfen — aber nur, wenn das
 * Geschlecht bekannt ist. Sonst entscheidet der Jahrgang allein.
 */
export function categoryFor(
  birthYear: number,
  season: Season,
  categories: Category[],
  gender?: "f" | "m" | "d",
): Category | undefined {
  const age = ageInSeason(birthYear, season)
  const direct = categories.find(
    (c) => age >= c.minAge && (c.maxAge === null || age <= c.maxAge),
  )
  if (direct) return direct
  if (gender === "f") {
    // Ein Jahr aelter ist in den Kategorien mit femaleExtraYear erlaubt.
    return categories.find(
      (c) => c.femaleExtraYear && c.maxAge !== null && age === c.maxAge + 1,
    )
  }
  return undefined
}

/** Kategorien aufsteigend nach Alter, damit die UI stabil sortiert. */
export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.minAge - b.minAge)
}

/** Hoechstes Alter, das die Juniorenstruktur ueberhaupt kennt. */
export function oldestAge(categories: Category[]): number {
  return categories.reduce((max, c) => Math.max(max, c.maxAge ?? c.minAge), 0)
}

/**
 * Rollenbezeichnungen, die eine Betreuungsperson kennzeichnen. Wichtig beim
 * Modell "eine Gemeinschaft pro Team": dort stehen Trainer und Betreuerinnen
 * in derselben Gemeinschaft wie die Kinder und wuerden sonst im Plan als
 * "faellt oben raus" auftauchen.
 *
 * "Admin" steht bewusst nicht in der Liste — das sagt nur etwas ueber Rechte
 * aus, nicht darueber, ob jemand Kind oder Betreuung ist.
 */
const STAFF_ROLE_WORDS = [
  "trainer",
  "trainerin",
  "coach",
  "leiter",
  "leiterin",
  "gruppenleiter",
  "betreuer",
  "betreuerin",
  "assistent",
  "vorstand",
  "eltern",
  "parent",
  "staff",
]

export function looksLikeStaff(role: string | undefined): boolean {
  if (!role) return false
  const value = role.toLowerCase()
  return STAFF_ROLE_WORDS.some((word) => value.includes(word))
}
