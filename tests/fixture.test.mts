/**
 * Faehrt die Beispieldatei durch genau den Weg, den auch der Browser nimmt:
 * echtes CSV-Parsing, automatische Spaltenerkennung, Wechselplan, Datencheck.
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { parseCsvText } from "../src/lib/io/parse.ts"
import { guessMapping, rowsToMembers, collectGroups } from "../src/lib/io/mapping.ts"
import { DEFAULT_CATEGORIES } from "../src/lib/domain/categories.ts"
import { computeTransition, bucketByTargetGroup } from "../src/lib/domain/transition.ts"
import { checkRoster } from "../src/lib/domain/roster.ts"

const season = { startYear: 2026 }
let passed = 0
function ok(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log("  PASS  " + name)
  } catch (e) {
    console.log("  FAIL  " + name + "\n        " + (e as Error).message)
    process.exitCode = 1
  }
}

const csvPath = fileURLToPath(new URL("../examples/beispiel-mitglieder.csv", import.meta.url))
const sheet = parseCsvText(readFileSync(csvPath, "utf8"), "beispiel-mitglieder.csv")
const mapping = guessMapping(sheet.headers)
const members = rowsToMembers(sheet, mapping)

console.log("\n== Beispieldatei (echtes CSV-Parsing) ==")
ok("25 Zeilen, 10 Spalten gelesen", () => {
  assert.equal(sheet.rows.length, 25)
  assert.equal(sheet.headers.length, 10)
})
ok("Spalten automatisch erkannt", () => {
  assert.equal(mapping.firstName, "Vorname")
  assert.equal(mapping.groups, "Gruppen")
  assert.equal(mapping.birthDate, "Geburtsdatum")
})
ok("in Anfuehrungszeichen gesetzte Mehrfachgruppe wird getrennt", () => {
  const robin = members.find((m) => m.firstName === "Robin")!
  assert.deepEqual(robin.groups, ["Junioren D", "Junioren C"])
})
ok("Gruppen im Export", () => {
  assert.deepEqual(collectGroups(members).map((g) => g.name), [
    "Junioren A", "Junioren B", "Junioren C", "Junioren D",
    "Junioren E", "Junioren F", "Junioren G", "Trainer", "Vorstand",
  ])
})

console.log("\n== Plan aus der Beispieldatei ==")
const plan = computeTransition(members, DEFAULT_CATEGORIES, season)
const by = (a: string) => plan.items.filter((i) => i.action === a)

ok("Trainer und Vorstand bleiben unberuehrt", () => {
  assert.deepEqual(
    plan.unmanaged.map((m) => m.lastName).sort(),
    ["Ohnegruppe", "Trainer", "Vorstand"],
  )
})
ok("jedes verwaltete Mitglied hat genau eine Zeile", () => {
  const managed = members.length - plan.unmanaged.length
  assert.equal(plan.items.length, managed)
})
ok("Plan geht auf", () => {
  const total = by("move").length + by("stay").length + by("graduate").length + by("review").length
  assert.equal(total, plan.items.length)
  assert.ok(by("move").length > 0)
})
ok("Noah (2007) faellt raus, Mia (2007, weiblich) nicht", () => {
  assert.ok(by("graduate").some((i) => i.member.firstName === "Noah"))
  assert.ok(!by("graduate").some((i) => i.member.firstName === "Mia"))
})
ok("Fabio ohne Geburtsdatum landet in Pruefen", () => {
  assert.ok(by("review").some((i) => i.member.firstName === "Fabio"))
})
ok("Arbeitsliste enthaelt jede Verschiebung genau einmal", () => {
  const buckets = bucketByTargetGroup(plan.items)
  const listed = buckets.flatMap((b) => b.items.map((i) => i.memberId))
  assert.equal(listed.length, by("move").length)
  assert.equal(new Set(listed).size, listed.length)
})
ok("jede Verschiebung nennt Ziel und Herkunft", () => {
  for (const item of by("move")) {
    assert.ok(item.targetGroup, item.member.lastName + " ohne Zielgruppe")
    assert.ok(item.removeGroups.length > 0, item.member.lastName + " ohne Herkunft")
    assert.ok(!item.removeGroups.includes(item.targetGroup!), "Ziel steht in removeGroups")
  }
})

console.log("\n== Datencheck der Beispieldatei ==")
const issues = checkRoster(members, DEFAULT_CATEGORIES, season)
const rule = (k: string) => issues.find((i) => i.ruleKey === k)
ok("findet das eingebaute Duplikat (Luca Meier)", () => {
  assert.equal(rule("rule.duplicateName")!.memberIds.length, 2)
})
ok("Geschwister mit gemeinsamer Elternadresse sind nur ein Hinweis", () => {
  // Familie Meier und Familie Widmer teilen sich je eine Adresse — normal,
  // aber es erklaert, warum Einladungen beim falschen Kind landen koennen.
  const shared = issues.filter((i) => i.ruleKey === "rule.sharedEmail")
  assert.ok(shared.length >= 2)
  assert.ok(shared.every((i) => i.severity === "info"))
})
ok("gleicher Name, anderer Jahrgang (Vater/Sohn) ist kein Duplikat", () => {
  const vaterSohn = [
    { ...members[0], id: "v1", firstName: "Reto", lastName: "Frei", birthYear: 1978 },
    { ...members[0], id: "v2", firstName: "Reto", lastName: "Frei", birthYear: 2011 },
  ]
  const found = checkRoster(vaterSohn, DEFAULT_CATEGORIES, season).find(
    (i) => i.ruleKey === "rule.sameNameDifferentYear",
  )!
  assert.equal(found.severity, "info")
  assert.equal(found.memberIds.length, 2)
})
ok("findet die kaputte E-Mail-Adresse", () => {
  assert.equal(rule("rule.invalidEmail")!.memberIds.length, 1)
})
ok("findet das Kind ohne Gruppe", () => {
  assert.equal(rule("rule.noGroup")!.memberIds.length, 1)
})
ok("findet das fehlende Geburtsdatum", () => {
  assert.equal(rule("rule.missingBirthYear")!.memberIds.length, 1)
})
ok("findet Robin in zwei Kategorien", () => {
  assert.ok(rule("rule.multipleCategories"))
})
ok("meldet keine ungueltigen AHV-Nummern", () => {
  assert.equal(rule("rule.invalidAhv"), undefined)
})

console.log("\n" + passed + " Pruefungen bestanden.\n")
