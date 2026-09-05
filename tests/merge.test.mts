/**
 * Beim FCWB ist jedes Team eine eigene Gumb-Gemeinschaft. Die Mitgliederliste
 * entsteht also erst aus mehreren Exporten — und genau dort kann man sich
 * Duplikate, verlorene Kinder und falsche Kategorien einhandeln.
 */
import assert from "node:assert/strict"
import {
  communityNameFromFile,
  mergeMembers,
  removeCommunity,
  tagWithCommunity,
} from "../src/lib/io/merge.ts"
import { DEFAULT_CATEGORIES } from "../src/lib/domain/categories.ts"
import { computeTransition } from "../src/lib/domain/transition.ts"
import type { Member } from "../src/lib/types.ts"

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

const member = (id: string, first: string, last: string, year?: number, extra: Partial<Member> = {}): Member => ({
  id,
  firstName: first,
  lastName: last,
  birthYear: year,
  birthDate: year ? `${year}-05-01` : undefined,
  groups: [],
  raw: {},
  ...extra,
})

console.log("\n== Gemeinschaftsnamen aus Dateinamen ==")
ok("Endung und Unterstriche verschwinden", () => {
  assert.equal(communityNameFromFile("Junioren_Ea.csv"), "Junioren Ea")
})
ok("angehaengtes Datum wird entfernt", () => {
  assert.equal(communityNameFromFile("Junioren Eb 2026-09-05.xlsx"), "Junioren Eb")
  assert.equal(communityNameFromFile("Junioren D 05.09.2026.csv"), "Junioren D")
})

console.log("\n== Exporte zusammenfuehren ==")
const teamF = tagWithCommunity(
  [member("m1", "Luca", "Meier", 2017), member("m2", "Nina", "Huber", 2018)],
  "Junioren F",
)
const teamE = tagWithCommunity(
  [member("m3", "Timo", "Frei", 2016), member("m4", "Jan", "Widmer", 2015)],
  "Junioren E",
)

ok("Gemeinschaftsname landet in groups", () => {
  assert.deepEqual(teamF[0].groups, ["Junioren F"])
  assert.deepEqual(teamE[1].groups, ["Junioren E"])
})
ok("zwei Teams ergeben eine Liste", () => {
  const all = mergeMembers(teamF, teamE)
  assert.equal(all.length, 4)
  assert.deepEqual(all.map((m) => m.id).sort(), ["m1", "m2", "m3", "m4"])
})
ok("dieselbe Person in zwei Teams behaelt beide Gemeinschaften", () => {
  // Kommt vor, wenn ein Kind eine Kategorie hoch mitspielt.
  const hoch = tagWithCommunity([member("m1", "Luca", "Meier", 2017)], "Junioren E")
  const all = mergeMembers(teamF, hoch)
  assert.equal(all.length, 2)
  assert.deepEqual(all.find((m) => m.id === "m1")!.groups, ["Junioren F", "Junioren E"])
})
ok("Luecken werden aus dem zweiten Export gefuellt, Vorhandenes nicht ueberschrieben", () => {
  const ohne = tagWithCommunity([member("m1", "Luca", "Meier", undefined, { email: "a@b.ch" })], "Junioren F")
  const mit = tagWithCommunity([member("m1", "Luca", "Meier", 2017, { email: "anders@b.ch" })], "Junioren E")
  const all = mergeMembers(ohne, mit)
  const luca = all.find((m) => m.id === "m1")!
  assert.equal(luca.birthYear, 2017, "fehlender Jahrgang wird ergaenzt")
  assert.equal(luca.email, "a@b.ch", "vorhandene Adresse bleibt")
})
ok("erneutes Einlesen desselben Teams verdoppelt niemanden", () => {
  // So macht es die Seite: erst die Gemeinschaft entfernen, dann neu mergen.
  const all = mergeMembers(teamF, teamE)
  const nochmal = mergeMembers(removeCommunity(all, "Junioren F"), teamF)
  assert.equal(nochmal.length, 4)
  assert.deepEqual(nochmal.find((m) => m.id === "m1")!.groups, ["Junioren F"])
})

console.log("\n== Export wieder entfernen ==")
ok("wer nur in diesem Team war, verschwindet", () => {
  const all = mergeMembers(teamF, teamE)
  const ohneF = removeCommunity(all, "Junioren F")
  assert.deepEqual(ohneF.map((m) => m.id).sort(), ["m3", "m4"])
})
ok("wer in zwei Teams steht, bleibt mit dem anderen erhalten", () => {
  const hoch = tagWithCommunity([member("m1", "Luca", "Meier", 2017)], "Junioren E")
  const all = mergeMembers(teamF, hoch)
  const ohneF = removeCommunity(all, "Junioren F")
  const luca = ohneF.find((m) => m.id === "m1")
  assert.ok(luca, "Luca darf nicht verschwinden")
  assert.deepEqual(luca!.groups, ["Junioren E"])
})
ok("Gross-/Kleinschreibung stoert nicht", () => {
  assert.equal(removeCommunity(teamF, "junioren f").length, 0)
})

console.log("\n== Plan ueber mehrere Gemeinschaften ==")
ok("die Fachlogik sieht keinen Unterschied zum Gruppen-Modell", () => {
  const all = mergeMembers(teamF, teamE)
  const plan = computeTransition(all, DEFAULT_CATEGORIES, season)
  const find = (n: string) => plan.items.find((i) => i.member.lastName === n)!
  // 2017 und 2015 ruecken auf, 2018 und 2016 bleiben.
  assert.equal(find("Meier").action, "move")
  assert.equal(find("Meier").targetGroup, "Junioren E")
  assert.deepEqual(find("Meier").removeGroups, ["Junioren F"])
  assert.equal(find("Huber").action, "stay")
  assert.equal(find("Frei").action, "stay")
  assert.equal(find("Widmer").action, "move")
  assert.equal(find("Widmer").targetGroup, "Junioren D")
})
ok("ein Team, das nicht eingelesen wurde, erzeugt keine Geisterkinder", () => {
  // Nur das F-Team eingelesen: der Plan kennt genau diese zwei Kinder.
  const plan = computeTransition(teamF, DEFAULT_CATEGORIES, season)
  assert.equal(plan.items.length, 2)
  assert.equal(plan.unmanaged.length, 0)
})
ok("Kind in zwei Gemeinschaften kommt in Pruefen, nicht in einen stillen Wechsel", () => {
  const hoch = tagWithCommunity([member("m1", "Luca", "Meier", 2017)], "Junioren E")
  const all = mergeMembers(teamF, hoch)
  const item = computeTransition(all, DEFAULT_CATEGORIES, season).items.find(
    (i) => i.memberId === "m1",
  )!
  assert.ok(item.reasons.includes("reason.multipleCategories"))
})

console.log("\n== Trainer:innen in der Team-Gemeinschaft ==")
ok("Erwachsene im Team werden nicht als «faellt oben raus» gefuehrt", () => {
  // Beim Modell "eine Gemeinschaft pro Team" steht der Trainer in derselben
  // Gemeinschaft wie die Kinder. Er darf nicht im Wechselplan landen.
  const mitTrainer = mergeMembers(
    teamF,
    tagWithCommunity([member("t1", "Marco", "Trainer", 1985)], "Junioren F"),
  )
  const plan = computeTransition(mitTrainer, DEFAULT_CATEGORIES, season)
  assert.deepEqual(plan.unmanaged.map((m) => m.id), ["t1"])
  assert.ok(!plan.items.some((i) => i.memberId === "t1"))
})
ok("die Rolle allein genuegt, auch ohne Jahrgang", () => {
  const ohneJahrgang = tagWithCommunity(
    [member("t2", "Petra", "Betreuerin", undefined, { role: "Trainerin" })],
    "Junioren F",
  )
  const plan = computeTransition(mergeMembers(teamF, ohneJahrgang), DEFAULT_CATEGORIES, season)
  assert.deepEqual(plan.unmanaged.map((m) => m.id), ["t2"])
})
ok("ein Kind, das wirklich oben rausfaellt, bleibt im Plan", () => {
  // 2007 wird 19 und ist damit knapp zu alt — das ist ein echter Abgang,
  // kein Erwachsener. Die Unterscheidung darf nicht verloren gehen.
  const abgang = tagWithCommunity([member("k1", "Noah", "Baumann", 2007)], "Junioren A")
  const plan = computeTransition(abgang, DEFAULT_CATEGORIES, season)
  assert.equal(plan.unmanaged.length, 0)
  assert.equal(plan.items[0].action, "graduate")
})
ok("«Admin» allein macht noch keine Betreuungsperson", () => {
  // Ein Kind kann in Gumb Admin-Rechte haben; das darf es nicht aus dem Plan werfen.
  const kind = tagWithCommunity(
    [member("k2", "Luca", "Meier", 2017, { role: "Admin" })],
    "Junioren F",
  )
  const plan = computeTransition(kind, DEFAULT_CATEGORIES, season)
  assert.equal(plan.unmanaged.length, 0)
  assert.equal(plan.items[0].action, "move")
})

console.log("\n" + passed + " Pruefungen bestanden.\n")
