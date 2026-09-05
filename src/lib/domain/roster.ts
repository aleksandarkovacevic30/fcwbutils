import { categoryFor } from "../domain/categories.ts"
import type { Category, Issue, Member, Season } from "../types.ts"

function normName(m: Member): string {
  return `${m.lastName} ${m.firstName}`.toLowerCase().replace(/\s+/g, " ").trim()
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** Schweizer AHV-Nummer (AHVN13): 756.1234.5678.97 */
const AHV_RE = /^756\.?\d{4}\.?\d{4}\.?\d{2}$/

function issue(
  id: string,
  severity: Issue["severity"],
  ruleKey: string,
  memberIds: string[],
  detail?: string,
): Issue {
  return { id, severity, ruleKey, memberIds, detail }
}

/**
 * Datenqualitaets-Pruefungen auf dem Mitglieder-Export. Das sind genau die
 * Probleme, die den Saisonwechsel und die J+S-Abrechnung sabotieren.
 */
export function checkRoster(
  members: Member[],
  categories: Category[],
  season: Season,
): Issue[] {
  const issues: Issue[] = []

  // --- Doppelte Personen -------------------------------------------------
  const byName = new Map<string, Member[]>()
  for (const m of members) {
    const key = normName(m)
    if (!key.trim()) continue
    const list = byName.get(key)
    if (list) list.push(m)
    else byName.set(key, [m])
  }
  for (const [key, group] of byName) {
    if (group.length < 2) continue
    const years = new Set(group.map((m) => m.birthYear ?? 0))
    // Gleicher Name + gleicher Jahrgang ist fast sicher ein Duplikat.
    // Gleicher Name + anderer Jahrgang sind meist Geschwister.
    issues.push(
      issue(
        `dup-name-${key}`,
        years.size === 1 ? "error" : "info",
        years.size === 1 ? "rule.duplicateName" : "rule.sameNameDifferentYear",
        group.map((m) => m.id),
        group.map((m) => `${m.firstName} ${m.lastName} (${m.birthYear ?? "?"})`).join(", "),
      ),
    )
  }

  const byEmail = new Map<string, Member[]>()
  for (const m of members) {
    if (!m.email) continue
    const key = m.email.toLowerCase()
    const list = byEmail.get(key)
    if (list) list.push(m)
    else byEmail.set(key, [m])
  }
  for (const [email, group] of byEmail) {
    if (group.length < 2) continue
    // Familien teilen sich oft eine Elternadresse — das ist kein Fehler,
    // aber es erklaert, warum Einladungen manchmal beim falschen Kind landen.
    issues.push(
      issue(`dup-email-${email}`, "info", "rule.sharedEmail", group.map((m) => m.id), email),
    )
  }

  // --- Fehlende Pflichtfelder -------------------------------------------
  const noBirth = members.filter((m) => !m.birthYear)
  if (noBirth.length) {
    issues.push(issue("no-birth", "error", "rule.missingBirthYear", noBirth.map((m) => m.id)))
  }

  const noExactBirth = members.filter((m) => m.birthYear && !m.birthDate)
  if (noExactBirth.length) {
    // Fuer den Saisonwechsel reicht der Jahrgang, fuer J+S nicht.
    issues.push(
      issue("no-birthdate", "warning", "rule.missingBirthDate", noExactBirth.map((m) => m.id)),
    )
  }

  const noGroup = members.filter((m) => m.groups.length === 0)
  if (noGroup.length) {
    issues.push(issue("no-group", "warning", "rule.noGroup", noGroup.map((m) => m.id)))
  }

  const noContact = members.filter((m) => !m.email && !m.phone)
  if (noContact.length) {
    issues.push(issue("no-contact", "warning", "rule.noContact", noContact.map((m) => m.id)))
  }

  const badEmail = members.filter((m) => m.email && !EMAIL_RE.test(m.email))
  if (badEmail.length) {
    issues.push(issue("bad-email", "error", "rule.invalidEmail", badEmail.map((m) => m.id)))
  }

  const badAhv = members.filter((m) => m.ahv && !AHV_RE.test(m.ahv.replace(/\s/g, "")))
  if (badAhv.length) {
    issues.push(issue("bad-ahv", "error", "rule.invalidAhv", badAhv.map((m) => m.id)))
  }

  // --- Unplausible Jahrgaenge -------------------------------------------
  const thisYear = new Date().getFullYear()
  const oddYear = members.filter(
    (m) => m.birthYear && (m.birthYear < thisYear - 100 || m.birthYear > thisYear),
  )
  if (oddYear.length) {
    issues.push(issue("odd-year", "error", "rule.implausibleBirthYear", oddYear.map((m) => m.id)))
  }

  // --- Gruppenzuordnung vs. Jahrgang ------------------------------------
  const groupToCategory = new Map<string, Category>()
  for (const c of categories) {
    for (const g of c.gumbGroups) groupToCategory.set(g.trim().toLowerCase(), c)
  }

  const multiCategory: string[] = []
  const wrongCategory: string[] = []
  const wrongDetail: string[] = []

  for (const m of members) {
    const cats = [
      ...new Set(
        m.groups
          .map((g) => groupToCategory.get(g.trim().toLowerCase()))
          .filter((c): c is Category => Boolean(c))
          .map((c) => c.id),
      ),
    ]
    if (cats.length > 1) multiCategory.push(m.id)
    if (cats.length === 1 && m.birthYear) {
      const should = categoryFor(m.birthYear, season, categories, m.gender)
      if (should && should.id !== cats[0]) {
        wrongCategory.push(m.id)
        wrongDetail.push(`${m.firstName} ${m.lastName} → ${should.name}`)
      }
    }
  }
  if (multiCategory.length) {
    issues.push(issue("multi-cat", "warning", "rule.multipleCategories", multiCategory))
  }
  if (wrongCategory.length) {
    issues.push(
      issue("wrong-cat", "info", "rule.categoryMismatch", wrongCategory, wrongDetail.slice(0, 5).join("; ")),
    )
  }

  const order: Record<Issue["severity"], number> = { error: 0, warning: 1, info: 2 }
  return issues.sort((a, b) => order[a.severity] - order[b.severity])
}
