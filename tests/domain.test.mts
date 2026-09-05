import assert from "node:assert/strict"
import { guessMapping, rowsToMembers, collectGroups } from "../src/lib/io/mapping.ts"
import { guessAttendanceMapping, rowsToAttendance } from "../src/lib/io/attendance.ts"
import {
  DEFAULT_CATEGORIES,
  birthYearsFor,
  categoryFor,
  seasonLabel,
} from "../src/lib/domain/categories.ts"
import {
  computeTransition,
  bucketByTargetGroup,
  verifyTransition,
} from "../src/lib/domain/transition.ts"
import { checkRoster } from "../src/lib/domain/roster.ts"
import { buildActivities, buildParticipants, checkJus, DEFAULT_JUS } from "../src/lib/domain/jus.ts"

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

console.log("\n== Kategorien (Saison " + seasonLabel(season) + ") ==")
ok("Junioren E = Jahrgaenge 2017/2016", () => {
  const e = DEFAULT_CATEGORIES.find((c) => c.id === "e")!
  assert.deepEqual(birthYearsFor(e, season), [2017, 2016])
})
ok("Junioren A = 2009/2008", () => {
  const a = DEFAULT_CATEGORIES.find((c) => c.id === "a")!
  assert.deepEqual(birthYearsFor(a, season), [2009, 2008])
})
ok("2020->G 2018->F 2016->E 2014->D 2012->C 2010->B 2008->A", () => {
  const map: Record<number, string> = {
    2020: "g", 2018: "f", 2016: "e", 2014: "d", 2012: "c", 2010: "b", 2008: "a",
  }
  for (const [year, id] of Object.entries(map))
    assert.equal(categoryFor(Number(year), season, DEFAULT_CATEGORIES)?.id, id, "Jahrgang " + year)
})
ok("2007 faellt oben raus, ausser Juniorin (ein Jahr aelter erlaubt)", () => {
  assert.equal(categoryFor(2007, season, DEFAULT_CATEGORIES), undefined)
  assert.equal(categoryFor(2007, season, DEFAULT_CATEGORIES, "f")?.id, "a")
})

console.log("\n== Spaltenerkennung (Gumb-Kopfzeilen) ==")
const headers = [
  "ID", "Vorname", "Nachname", "E-Mail", "Geburtsdatum",
  "Geschlecht", "Telefon", "Gruppen", "Rolle", "AHV-Nummer",
]
const mapping = guessMapping(headers)
ok("erkennt alle Spalten", () => {
  assert.equal(mapping.firstName, "Vorname")
  assert.equal(mapping.lastName, "Nachname")
  assert.equal(mapping.birthDate, "Geburtsdatum")
  assert.equal(mapping.groups, "Gruppen")
  assert.equal(mapping.email, "E-Mail")
  assert.equal(mapping.ahv, "AHV-Nummer")
  assert.equal(mapping.gender, "Geschlecht")
})
ok("Name klaut nicht Vorname", () => {
  const m = guessMapping(["Name", "Vorname", "Nachname"])
  assert.equal(m.firstName, "Vorname")
  assert.equal(m.lastName, "Nachname")
})
ok("englische Kopfzeilen gehen auch", () => {
  const m = guessMapping(["First name", "Last name", "Date of birth", "Groups"])
  assert.equal(m.firstName, "First name")
  assert.equal(m.birthDate, "Date of birth")
  assert.equal(m.groups, "Groups")
})

console.log("\n== Mitglieder einlesen ==")
const row = (
  id: string, v: string, n: string, dob: string, g: string,
  extra: Record<string, string> = {},
) => ({
  ID: id, Vorname: v, Nachname: n, Geburtsdatum: dob, Gruppen: g,
  "E-Mail": "", Telefon: "", Rolle: "", Geschlecht: "", "AHV-Nummer": "", ...extra,
})

const sheet = {
  fileName: "gumb.csv",
  headers,
  rows: [
    row("101", "Luca", "Meier", "14.03.2017", "Junioren F"),
    row("102", "Nina", "Huber", "02.11.2016", "Junioren F"),
    row("103", "Timo", "Frei", "2016-07-30", "Junioren E"),
    row("104", "Jan", "Widmer", "21.01.2014", "Junioren E"),
    row("105", "Elias", "Suter", "05.09.2008", "Junioren A"),
    row("106", "Noah", "Baumann", "11.06.2007", "Junioren A"),
    row("107", "Mia", "Kaiser", "30.04.2007", "Junioren A", { Geschlecht: "w" }),
    row("108", "Ohne", "Jahrgang", "", "Junioren D"),
    row("109", "Doppel", "Gruppe", "19.02.2013", "Junioren D, Junioren C"),
    row("110", "Marco", "Trainer", "01.01.1985", "Trainer"),
    row("111", "Luca", "Meier", "14.03.2017", "Junioren F"),
  ],
}
const members = rowsToMembers(sheet, mapping)

ok("Schweizer und ISO-Datum werden beide erkannt", () => {
  assert.equal(members[0].birthDate, "2017-03-14")
  assert.equal(members[0].birthYear, 2017)
  assert.equal(members[2].birthDate, "2016-07-30")
})
ok("Mehrfachgruppen werden getrennt", () => {
  assert.deepEqual(members[8].groups, ["Junioren D", "Junioren C"])
})
ok("Geschlecht w wird als weiblich gelesen", () => assert.equal(members[6].gender, "f"))
ok("Gruppenliste aus dem Export", () => {
  const groups = collectGroups(members).map((g) => g.name)
  assert.deepEqual(groups, [
    "Junioren A", "Junioren C", "Junioren D", "Junioren E", "Junioren F", "Trainer",
  ])
})

console.log("\n== Gruppenwechsel ==")
const plan = computeTransition(members, DEFAULT_CATEGORIES, season)
const find = (n: string) => plan.items.find((i) => i.member.lastName === n)!

ok("Trainer bleibt unberuehrt (keine zugeordnete Gruppe)", () => {
  assert.equal(plan.unmanaged.length, 1)
  assert.equal(plan.unmanaged[0].lastName, "Trainer")
})
ok("Luca (2017) wechselt F -> E", () => {
  const i = find("Meier")
  assert.equal(i.action, "move")
  assert.equal(i.targetGroup, "Junioren E")
  assert.deepEqual(i.removeGroups, ["Junioren F"])
})
ok("Nina (2016) wechselt F -> E", () => assert.equal(find("Huber").targetGroup, "Junioren E"))
ok("Timo (2016) bleibt in E", () => assert.equal(find("Frei").action, "stay"))
ok("Jan (2014) wechselt E -> D", () => {
  const i = find("Widmer")
  assert.equal(i.action, "move")
  assert.equal(i.targetGroup, "Junioren D")
})
ok("Elias (2008) bleibt A", () => assert.equal(find("Suter").action, "stay"))
ok("Noah (2007) faellt oben raus", () => {
  const i = find("Baumann")
  assert.equal(i.action, "graduate")
  assert.deepEqual(i.removeGroups, ["Junioren A"])
})
ok("Mia (2007, weiblich) darf in A bleiben", () => {
  assert.equal(find("Kaiser").action, "stay")
})
ok("Ohne Jahrgang -> Review mit Begruendung", () => {
  const i = find("Jahrgang")
  assert.equal(i.action, "review")
  assert.deepEqual(i.reasons, ["reason.noBirthYear"])
})
ok("In zwei Kategorien -> Review, nicht stillschweigend geraten", () => {
  assert.ok(find("Gruppe").reasons.includes("reason.multipleCategories"))
})

console.log("\n== Arbeitsliste ==")
const buckets = bucketByTargetGroup(plan.items)
ok("nach Zielgruppe gebuendelt, alphabetisch", () => {
  assert.deepEqual(buckets.map((b) => b.targetGroup), ["Junioren D", "Junioren E"])
  assert.deepEqual(buckets[1].items.map((i) => i.member.lastName), ["Huber", "Meier", "Meier"])
})

console.log("\n== Mehrere Gruppen pro Kategorie (Ea/Eb) ==")
const split = DEFAULT_CATEGORIES.map((c) =>
  c.id === "e" ? { ...c, gumbGroups: ["Junioren Ea", "Junioren Eb"] } : c,
)
ok("markiert die Entscheidung statt zu raten", () => {
  const p = computeTransition(members, split, season)
  const i = p.items.find((x) => x.member.firstName === "Luca")!
  assert.equal(i.needsDecision, true)
  assert.deepEqual(i.candidates, ["Junioren Ea", "Junioren Eb"])
})
ok("Override setzt die Zielgruppe", () => {
  const luca = members[0].id
  const p = computeTransition(members, split, season, { [luca]: "Junioren Eb" })
  assert.equal(p.items.find((x) => x.memberId === luca)!.targetGroup, "Junioren Eb")
})
ok("Zielgruppe steht nie zugleich in der Entfernen-Liste", () => {
  // Von Hand die Gruppe waehlen, in der das Kind schon ist: die Arbeitsliste
  // darf daraus kein "raus aus F, rein in F" machen.
  const luca = members[0].id
  const p = computeTransition(members, DEFAULT_CATEGORIES, season, { [luca]: "Junioren F" })
  const i = p.items.find((x) => x.memberId === luca)!
  assert.equal(i.targetGroup, "Junioren F")
  assert.deepEqual(i.removeGroups, [])
})
ok("bleibt und ueberspringen werden respektiert", () => {
  const luca = members[0].id
  const nina = members[1].id
  const p = computeTransition(members, DEFAULT_CATEGORIES, season, {
    [luca]: "__stay__",
    [nina]: "__skip__",
  })
  assert.equal(p.items.find((x) => x.memberId === luca)!.action, "stay")
  assert.equal(p.items.find((x) => x.memberId === nina), undefined)
})

console.log("\n== Kontrolle nach der Handarbeit ==")
const moves = plan.items.filter((i) => i.action === "move")
const applied = members.map((m) => {
  const item = moves.find((i) => i.memberId === m.id)
  return item ? { ...m, groups: [item.targetGroup!] } : m
})
ok("alles korrekt uebernommen", () => {
  const r = verifyTransition(plan.items, applied, members)
  assert.equal(r.ok.length, moves.length)
  assert.equal(r.missing.length, 0)
})
ok("vergessene Verschiebung wird gemeldet", () => {
  const halb = applied.map((m) =>
    m.id === members[1].id ? { ...m, groups: ["Junioren F"] } : m,
  )
  const r = verifyTransition(plan.items, halb, members)
  assert.equal(r.missing.length, 1)
  assert.equal(r.missing[0].item.member.lastName, "Huber")
})
ok("alte Gruppe noch dran = noch nicht fertig", () => {
  const halb = applied.map((m) =>
    m.id === members[0].id ? { ...m, groups: ["Junioren E", "Junioren F"] } : m,
  )
  const r = verifyTransition(plan.items, halb, members)
  assert.ok(r.missing.some((x) => x.item.member.firstName === "Luca"))
})
ok("neue Kinder im zweiten Export werden erkannt", () => {
  const neu = [...applied, { ...members[0], id: "neu1", firstName: "Neu", lastName: "Kind" }]
  assert.equal(verifyTransition(plan.items, neu, members).added.length, 1)
})

console.log("\n== Datencheck ==")
const issues = checkRoster(members, DEFAULT_CATEGORIES, season)
const rule = (k: string) => issues.find((i) => i.ruleKey === k)
ok("findet das echte Duplikat", () => {
  const i = rule("rule.duplicateName")!
  assert.equal(i.severity, "error")
  assert.equal(i.memberIds.length, 2)
})
ok("findet fehlenden Jahrgang", () =>
  assert.equal(rule("rule.missingBirthYear")!.memberIds.length, 1))
ok("findet Kind in zwei Kategorien", () => assert.ok(rule("rule.multipleCategories")))
ok("findet fehlende Kontaktangaben", () =>
  assert.equal(rule("rule.noContact")!.memberIds.length, members.length))
ok("meldet ungueltige AHV-Nummer", () => {
  const bad = [{ ...members[0], ahv: "756.1234" }]
  assert.ok(checkRoster(bad, DEFAULT_CATEGORIES, season).some((i) => i.ruleKey === "rule.invalidAhv"))
})
ok("akzeptiert gueltige AHV-Nummer", () => {
  const good = [{ ...members[0], ahv: "756.1234.5678.97" }]
  assert.ok(!checkRoster(good, DEFAULT_CATEGORIES, season).some((i) => i.ruleKey === "rule.invalidAhv"))
})
ok("Fehler stehen vor Warnungen", () => {
  const order: Record<string, number> = { error: 0, warning: 1, info: 2 }
  const sev = issues.map((i) => i.severity)
  assert.deepEqual([...sev].sort((a, b) => order[a] - order[b]), sev)
})

console.log("\n== J+S-Anwesenheitskontrolle ==")
const aHeaders = [
  "Event-ID", "Datum", "Startzeit", "Endzeit", "Vorname",
  "Nachname", "Geburtsdatum", "AHV-Nummer", "Anwesenheitsstatus",
]
const aMap = guessAttendanceMapping(aHeaders)
ok("erkennt die J+S-Spalten", () => {
  assert.equal(aMap.eventId, "Event-ID")
  assert.equal(aMap.status, "Anwesenheitsstatus")
  assert.equal(aMap.start, "Startzeit")
  assert.equal(aMap.end, "Endzeit")
})
const ar = (
  ev: string, d: string, s: string, e: string,
  v: string, n: string, dob: string, ahv: string, st: string,
) => ({
  "Event-ID": ev, Datum: d, Startzeit: s, Endzeit: e, Vorname: v,
  Nachname: n, Geburtsdatum: dob, "AHV-Nummer": ahv, Anwesenheitsstatus: st,
})
const aSheet = {
  fileName: "awk.xlsx",
  headers: aHeaders,
  rows: [
    ar("E1", "04.03.2026", "18:00", "19:30", "Luca", "Meier", "14.03.2017", "756.1234.5678.97", "Anwesend"),
    ar("E1", "04.03.2026", "18:00", "19:30", "Nina", "Huber", "02.11.2016", "756.1234.5678.98", "Anwesend"),
    ar("E1", "04.03.2026", "18:00", "19:30", "Timo", "Frei", "30.07.2016", "", "Abwesend"),
    ar("E2", "06.03.2026", "18:00", "19:00", "Luca", "Meier", "14.03.2017", "756.1234.5678.97", "Anwesend"),
    ar("E2", "06.03.2026", "18:00", "19:00", "Timo", "Frei", "30.07.2016", "", "Anwesend"),
    ar("E3", "06.03.2026", "20:00", "21:30", "Luca", "Meier", "14.03.2017", "756.1234.5678.97", "Anwesend"),
    ar("E4", "08.03.2026", "", "", "Alt", "Herr", "01.01.1980", "756.1111.2222.33", "Anwesend"),
  ],
}
const att = rowsToAttendance(aSheet, aMap)
const acts = buildActivities(att)
const parts = buildParticipants(att)
const findings = checkJus(att, acts, parts, DEFAULT_JUS)
const f = (k: string) => findings.find((x) => x.ruleKey === k)

ok("Status wird korrekt gelesen", () => {
  assert.equal(att[0].present, true)
  assert.equal(att[2].present, false)
})
ok("Aktivitaeten und Dauer", () => {
  assert.equal(acts.length, 4)
  assert.equal(acts.find((a) => a.eventId === "E1")!.minutes, 90)
  assert.equal(acts.find((a) => a.eventId === "E2")!.minutes, 60)
})
ok("Aktivitaeten unter 3 Anwesenden werden gemeldet", () => {
  const found = f("jus.tooFewParticipants")!
  assert.equal(found.severity, "error")
  assert.equal(found.items.length, 4)
})
ok("fehlende Zeiten werden gemeldet", () => assert.equal(f("jus.missingTimes")!.items.length, 1))
ok("fehlende AHV-Nummer wird gemeldet", () => {
  assert.deepEqual(f("jus.missingAhv")!.items, ["Timo Frei"])
})
ok("zu alt fuer J+S wird zum Aktivitaetsdatum geprueft", () => {
  assert.deepEqual(f("jus.outsideAgeRange")!.items, ["Alt Herr (46)"])
})
ok("zweimal am selben Tag wird gemeldet", () => {
  const items = f("jus.multiplePerDay")!.items
  assert.equal(items.length, 1)
  assert.ok(items[0].startsWith("2026-03-06: Luca Meier"))
})
ok("Anwesenheitsquote pro Person", () => {
  const luca = parts.find((p) => p.firstName === "Luca")!
  assert.equal(luca.presentCount, 3)
  assert.equal(luca.listedCount, 3)
})

console.log("\n" + passed + " Pruefungen bestanden.\n")
