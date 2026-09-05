/**
 * Die Ausgabedateien sind das, was tatsaechlich beim Menschen ankommt.
 * Darum werden sie hier nicht nur erzeugt, sondern auch wieder eingelesen
 * und geprueft.
 */
import assert from "node:assert/strict"
import ExcelJS from "exceljs"
import { buildPlanCsv, buildPlanWorkbook, planFileName } from "../src/lib/io/export.ts"
import { computeTransition } from "../src/lib/domain/transition.ts"
import { DEFAULT_CATEGORIES } from "../src/lib/domain/categories.ts"
import { mergeMembers, tagWithCommunity } from "../src/lib/io/merge.ts"
import { translate, type TranslationKey } from "../src/lib/i18n.ts"
import type { Member } from "../src/lib/types.ts"

const season = { startYear: 2026 }
const t = (key: string, vars?: Record<string, string | number>) =>
  translate("de", key as TranslationKey, vars)

let passed = 0
function ok(name: string, fn: () => void | Promise<void>) {
  const run = async () => {
    try {
      await fn()
      passed++
      console.log("  PASS  " + name)
    } catch (e) {
      console.log("  FAIL  " + name + "\n        " + (e as Error).message)
      process.exitCode = 1
    }
  }
  return run()
}

const member = (id: string, first: string, last: string, year?: number): Member => ({
  id,
  firstName: first,
  lastName: last,
  birthYear: year,
  birthDate: year ? `${year}-05-01` : undefined,
  groups: [],
  raw: {},
})

const members = mergeMembers(
  tagWithCommunity(
    [
      member("m1", "Luca", "Meier", 2017), // -> E
      member("m2", "Nina", "Huber", 2018), // bleibt
      member("m3", "Marco", "Trainer", 1985), // unberuehrt
    ],
    "Junioren F",
  ),
  tagWithCommunity(
    [
      member("m4", "Timo", "Frei", 2016), // bleibt
      member("m5", "Jan", "Widmer", 2015), // -> D
      member("m6", "Ohne", 'Jahr"gang', undefined), // pruefen, mit Anfuehrungszeichen
    ],
    "Junioren E",
  ),
)

const plan = computeTransition(members, DEFAULT_CATEGORIES, season)

await (async () => {
  console.log("\n== Dateiname ==")
  await ok("enthaelt die Saison und keinen Schraegstrich", () => {
    assert.equal(planFileName(season, "xlsx"), "fcwb-gruppenwechsel-2026-27.xlsx")
  })

  console.log("\n== CSV ==")
  const csv = buildPlanCsv(plan.items, t)
  const lines = csv.split("\r\n").filter(Boolean)

  await ok("beginnt mit BOM, damit Excel die Umlaute richtig liest", () => {
    assert.equal(csv.charCodeAt(0), 0xfeff)
  })
  await ok("Semikolon als Trennzeichen (deutsches Excel)", () => {
    assert.ok(lines[0].startsWith("﻿Nachname;Vorname;Jahrgang;Status;Von;Nach;Hinweise"))
  })
  await ok("eine Zeile pro Person im Plan", () => {
    assert.equal(lines.length - 1, plan.items.length)
  })
  await ok("Anfuehrungszeichen im Namen werden verdoppelt, nicht verschluckt", () => {
    // Nicht nach "Jahr" suchen — das steht auch in der Kopfzeile ("Jahrgang").
    const row = lines.find((l) => l.startsWith('"'))
    assert.ok(row, "keine Zeile mit maskiertem Feld gefunden")
    assert.ok(row!.startsWith('"Jahr""gang";Ohne;'), row)
  })
  await ok("der Wechsel steht mit Herkunft und Ziel drin", () => {
    const row = lines.find((l) => l.startsWith("Meier;"))!
    assert.ok(row.includes("Junioren F"), row)
    assert.ok(row.includes("Junioren E"), row)
    assert.ok(row.includes("Wechselt"), row)
  })

  console.log("\n== Excel-Arbeitsmappe ==")
  const blob = await buildPlanWorkbook(plan.items, season, t)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await blob.arrayBuffer())
  const names = workbook.worksheets.map((s) => s.name)

  await ok("Plan, Arbeitsliste und je ein Blatt pro Team", () => {
    assert.ok(names.includes("Plan"), names.join(", "))
    assert.ok(names.includes("Arbeitsliste"), names.join(", "))
    assert.ok(names.includes("Junioren F"), names.join(", "))
    assert.ok(names.includes("Junioren E"), names.join(", "))
    assert.ok(names.includes("Junioren D"), names.join(", "))
  })
  await ok("kein Blattname ist laenger als die 31 Zeichen, die Excel erlaubt", () => {
    for (const name of names) assert.ok(name.length <= 31, name)
  })

  const planSheet = workbook.getWorksheet("Plan")!
  await ok("Plan enthaelt alle Zeilen plus Kopfzeile", () => {
    assert.equal(planSheet.rowCount, plan.items.length + 1)
  })
  await ok("Kopfzeile ist fett und eingefroren", () => {
    assert.equal(planSheet.getRow(1).font?.bold, true)
    // ySplit gibt es nur in der "frozen"-Variante der View-Union.
    assert.equal((planSheet.views[0] as { ySplit?: number } | undefined)?.ySplit, 1)
  })

  const worklist = workbook.getWorksheet("Arbeitsliste")!
  await ok("Arbeitsliste enthaelt nur die Wechsel", () => {
    const moves = plan.items.filter((i) => i.action === "move")
    assert.equal(worklist.rowCount - 1, moves.length)
  })
  await ok("Arbeitsliste ist nach Ziel gebuendelt und hat eine Erledigt-Spalte", () => {
    assert.equal(worklist.getRow(1).getCell(1).value, "Nach")
    assert.equal(worklist.getRow(1).getCell(7).value, "Erledigt")
    const targets = [2, 3].map((r) => worklist.getRow(r).getCell(1).value)
    assert.deepEqual(targets, ["Junioren D", "Junioren E"])
  })

  const teamF = workbook.getWorksheet("Junioren F")!
  await ok("Team-Blatt zeigt Abgaenge des Teams", () => {
    const rows: string[][] = []
    teamF.eachRow((row, n) => {
      if (n > 1) rows.push([String(row.getCell(1).value), String(row.getCell(2).value)])
    })
    // Luca verlaesst die F, sonst niemand.
    assert.deepEqual(rows, [["Abgang", "Meier"]])
  })
  const teamE = workbook.getWorksheet("Junioren E")!
  await ok("Team-Blatt zeigt Zugaenge und Abgaenge getrennt", () => {
    const rows: string[][] = []
    teamE.eachRow((row, n) => {
      if (n > 1) rows.push([String(row.getCell(1).value), String(row.getCell(2).value)])
    })
    // Luca kommt in die E, Jan verlaesst sie.
    assert.deepEqual(rows, [
      ["Zugang", "Meier"],
      ["Abgang", "Widmer"],
    ])
  })
  await ok("der Trainer taucht in keiner Datei auf", () => {
    assert.ok(!csv.includes("Trainer"))
    let found = false
    for (const sheet of workbook.worksheets) {
      sheet.eachRow((row) => {
        if (String(row.getCell(1).value) === "Trainer") found = true
      })
    }
    assert.equal(found, false)
  })

  console.log("\n== Blattnamen mit Sonderzeichen ==")
  await ok("Schraegstriche im Teamnamen sprengen die Datei nicht", () => {
    const odd = tagWithCommunity([member("x1", "Test", "Kind", 2017)], "Junioren E/F [alt]")
    const oddPlan = computeTransition(
      odd,
      DEFAULT_CATEGORIES.map((c) =>
        c.id === "f" ? { ...c, gumbGroups: ["Junioren E/F [alt]"] } : c,
      ),
      season,
    )
    assert.equal(oddPlan.items.length, 1)
  })
  await ok("Sonderzeichen werden im Blattnamen ersetzt", async () => {
    const odd = tagWithCommunity([member("x1", "Test", "Kind", 2017)], "Junioren E/F [alt]")
    const cats = DEFAULT_CATEGORIES.map((c) =>
      c.id === "f" ? { ...c, gumbGroups: ["Junioren E/F [alt]"] } : c,
    )
    const oddPlan = computeTransition(odd, cats, season)
    const oddBlob = await buildPlanWorkbook(oddPlan.items, season, t)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await oddBlob.arrayBuffer())
    for (const sheet of wb.worksheets) {
      assert.ok(!/[:\\/?*[\]]/.test(sheet.name), sheet.name)
    }
  })

  console.log("\n" + passed + " Pruefungen bestanden.\n")
})()
