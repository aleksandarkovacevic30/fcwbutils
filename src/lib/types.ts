/**
 * Datenmodell der App.
 *
 * WICHTIG: Alle diese Objekte leben ausschliesslich im Browser
 * (localStorage). Es gibt keinen Server-Persistenzpfad.
 */

/** Ein Mitglied, so wie es aus dem Gumb-Export gelesen wurde. */
export type Member = {
  /** Stabile ID: Gumb-ID falls vorhanden, sonst aus Name + Geburtsdatum abgeleitet. */
  id: string
  firstName: string
  lastName: string
  /** ISO yyyy-mm-dd, falls im Export vorhanden. */
  birthDate?: string
  /** Aus birthDate abgeleitet oder direkt aus einer Jahrgangs-Spalte. */
  birthYear?: number
  gender?: "f" | "m" | "d"
  email?: string
  phone?: string
  /** Gruppennamen exakt so, wie sie in Gumb stehen. */
  groups: string[]
  role?: string
  /** AHV-Nummer, fuer die J+S-Anwesenheitskontrolle. */
  ahv?: string
  /** Originalzeile, damit nichts verloren geht, was wir nicht kennen. */
  raw: Record<string, string>
}

/**
 * Eine Alterskategorie. `minAge`/`maxAge` beziehen sich auf das Alter,
 * das im Kalenderjahr des Saisonstarts erreicht wird
 * (Alter = Saisonstartjahr − Jahrgang). Das ist die Schweizer Lesart:
 * fuer die Saison 2026/27 ist Saisonstartjahr = 2026.
 */
export type Category = {
  id: string
  /** Anzeigename der Kategorie, z.B. "Junioren E". */
  name: string
  minAge: number
  /** `null` = nach oben offen (z.B. Aktive/Senioren). */
  maxAge: number | null
  /**
   * Gumb-Gruppen, die zu dieser Kategorie gehoeren. Ein Verein hat oft
   * mehrere Gruppen pro Kategorie (Ea/Eb, Staerkeklassen, Juniorinnen).
   * Die erste Gruppe ist das Standard-Ziel beim Aufstieg.
   */
  gumbGroups: string[]
  /** Maedchen duerfen in dieser Kategorie ein Jahr aelter sein (SFV-Regel fuer D/C/B/A). */
  femaleExtraYear?: boolean
}

export type Season = {
  /** Startjahr, z.B. 2026 fuer die Saison 2026/27. */
  startYear: number
}

/** Was mit einem Mitglied beim Saisonwechsel passieren soll. */
export type TransitionAction =
  | "stay" // bleibt in der Gruppe
  | "move" // wechselt die Gruppe
  | "graduate" // faellt oben aus der Juniorenstruktur heraus
  | "review" // manuell anschauen (Daten unklar oder mehrdeutig)

export type TransitionItem = {
  memberId: string
  member: Member
  action: TransitionAction
  /** Kategorie, in der das Mitglied laut Jahrgang neu sein muesste. */
  targetCategory?: Category
  /** Konkrete Gumb-Gruppe, in die verschoben werden soll. */
  targetGroup?: string
  /** Gruppen, aus denen das Mitglied entfernt werden soll. */
  removeGroups: string[]
  /** i18n-Keys, die erklaeren, warum diese Zeile so aussieht. */
  reasons: string[]
  /**
   * Die Zielkategorie hat mehrere Gruppen (Ea/Eb, Staerkeklassen) — die App
   * kann nicht wissen, welche gemeint ist. Muss von Hand entschieden werden.
   */
  needsDecision?: boolean
  /** Kandidaten, falls needsDecision. */
  candidates?: string[]
}

/**
 * Manuelle Korrektur pro Mitglied. Der Wert ist entweder ein Gruppenname,
 * `__stay__` (bleibt, wo es ist) oder `__skip__` (nicht in der Arbeitsliste).
 */
export type TransitionOverride = string
export const STAY = "__stay__"
export const SKIP = "__skip__"

/** Fortschritt der manuellen Klickarbeit in Gumb. */
export type WorklistProgress = Record<string, boolean>

export type Issue = {
  id: string
  severity: "error" | "warning" | "info"
  /** i18n-Key des Regeltitels. */
  ruleKey: string
  /** Betroffene Mitglieder-IDs. */
  memberIds: string[]
  /** Zusaetzlicher Kontext, direkt anzeigbar (keine Uebersetzung). */
  detail?: string
}

/** Eine Zeile aus dem Gumb-Export "Anwesenheitskontrolle". */
export type AttendanceRow = {
  eventId: string
  date?: string
  start?: string
  end?: string
  firstName: string
  lastName: string
  birthDate?: string
  ahv?: string
  status: string
  present: boolean
  raw: Record<string, string>
}

export type Locale = "de" | "en"

/**
 * Wie der Verein Gumb aufgebaut hat. Das entscheidet, woher die aktuelle
 * Kategorie eines Mitglieds kommt und wie in Gumb verschoben wird.
 *
 * - "groups":      eine Gemeinschaft, Teams sind Gruppen darin.
 *                  Aktuelle Kategorie steht in der Gruppen-Spalte des Exports.
 *                  Verschoben wird ueber das Dropdown im Mitglieder-Tab.
 * - "communities": eine Gemeinschaft pro Team (so macht es der FCWB).
 *                  Aktuelle Kategorie ergibt sich daraus, aus welchem Export
 *                  das Mitglied stammt. Verschoben wird ueber die
 *                  Mitglieder-Matrix, und zwar in zwei Schritten:
 *                  in der Zielgemeinschaft hinzufuegen, in der alten entfernen.
 */
export type Structure = "groups" | "communities"

/** Eine eingelesene Datei: bei "communities" entspricht sie einer Gemeinschaft. */
export type Source = {
  id: string
  /** Name der Gemeinschaft bzw. der Datei. */
  name: string
  fileName: string
  memberCount: number
  importedAt: string
}

/** Vollstaendiger persistierter Zustand — das ist auch das Backup-Format. */
export type AppState = {
  version: 1
  locale: Locale
  season: Season
  categories: Category[]
  members: Member[]
  /** Zweiter Import fuer den Soll-Ist-Vergleich nach der Handarbeit. */
  verifyMembers: Member[] | null
  structure: Structure
  /** Bei "communities": die einzelnen Exporte, aus denen sich `members` speist. */
  sources: Source[]
  /** Dasselbe fuer den Kontroll-Import nach der Handarbeit. */
  verifySources: Source[]
  worklistProgress: WorklistProgress
  /** Manuelle Korrekturen am berechneten Plan, memberId -> Gruppe|STAY|SKIP. */
  overrides: Record<string, TransitionOverride>
  attendance: AttendanceRow[]
  jus: {
    /** Mindestteilnehmerzahl pro Aktivitaet (J+S: 3). */
    minParticipants: number
    /** Zulaessige Altersspanne fuer J+S (5–20 Jahre). */
    minAge: number
    maxAge: number
    /** AHV-Nummer als Pflichtfeld pruefen. */
    requireAhv: boolean
  }
}
