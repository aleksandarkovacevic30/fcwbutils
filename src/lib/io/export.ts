import { seasonLabel } from "../domain/categories.ts"
import { bucketByTargetGroup } from "../domain/transition.ts"
import type { Season, TransitionItem } from "../types.ts"

/**
 * Gumb kennt keinen Mitglieder-Import. Diese Dateien sind deshalb bewusst
 * *keine* Import-Vorlage, sondern Arbeitsunterlagen: zum Abarbeiten, zum
 * Weitergeben an die Trainer:innen und als Beleg, was in dieser Saison
 * beschlossen wurde.
 */

export type Translate = (key: string, vars?: Record<string, string | number>) => string

export type PlanRow = {
  lastName: string
  firstName: string
  birthYear: string
  status: string
  from: string
  to: string
  notes: string
}

const ACTION_KEY: Record<TransitionItem["action"], string> = {
  move: "trans.action.move",
  stay: "trans.action.stay",
  graduate: "trans.action.graduate",
  review: "trans.action.review",
}

function toRow(item: TransitionItem, t: Translate): PlanRow {
  return {
    lastName: item.member.lastName,
    firstName: item.member.firstName,
    birthYear: item.member.birthYear ? String(item.member.birthYear) : "",
    status: t(ACTION_KEY[item.action]),
    from: item.action === "move" ? item.removeGroups.join(", ") : item.member.groups.join(", "),
    to: item.targetGroup ?? "",
    notes: item.reasons.map((r) => t(r)).join(" · "),
  }
}

function byName(a: TransitionItem, b: TransitionItem): number {
  return `${a.member.lastName} ${a.member.firstName}`.localeCompare(
    `${b.member.lastName} ${b.member.firstName}`,
    "de",
  )
}

function headers(t: Translate): string[] {
  return [
    t("export.colLastName"),
    t("export.colFirstName"),
    t("export.colBirthYear"),
    t("export.colStatus"),
    t("export.colFrom"),
    t("export.colTo"),
    t("export.colNotes"),
  ]
}

function rowValues(row: PlanRow): string[] {
  return [row.lastName, row.firstName, row.birthYear, row.status, row.from, row.to, row.notes]
}

/**
 * CSV mit Semikolon und BOM: so oeffnet Excel im deutschen Sprachraum die
 * Datei ohne Import-Dialog und mit korrekten Umlauten.
 */
export function buildPlanCsv(items: TransitionItem[], t: Translate): string {
  const escape = (value: string) =>
    /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

  const lines = [headers(t).map(escape).join(";")]
  for (const item of [...items].sort(byName)) {
    lines.push(rowValues(toRow(item, t)).map(escape).join(";"))
  }
  return `﻿${lines.join("\r\n")}\r\n`
}

/** Excel erlaubt keine Sonderzeichen im Blattnamen und maximal 31 Zeichen. */
function sheetName(raw: string, used: Set<string>): string {
  let name = raw.replace(/[:\\/?*[\]]/g, "-").slice(0, 31).trim() || "Blatt"
  if (used.has(name.toLowerCase())) {
    // Bei Kollision durchnummerieren, sonst wirft ExcelJS.
    let suffix = 2
    const base = name.slice(0, 28)
    while (used.has(`${base} ${suffix}`.toLowerCase())) suffix++
    name = `${base} ${suffix}`
  }
  used.add(name.toLowerCase())
  return name
}

/**
 * Arbeitsmappe mit drei Ebenen:
 *  - "Plan": alles, zum Nachschlagen und Archivieren
 *  - "Arbeitsliste": nur die Wechsel, nach Ziel gebuendelt, mit Erledigt-Spalte
 *  - ein Blatt pro Team: Zugaenge und Abgaenge, damit man es der Trainerin
 *    ihres Teams schicken kann, ohne dass sie die ganze Liste durchsucht
 */
export async function buildPlanWorkbook(
  items: TransitionItem[],
  season: Season,
  t: Translate,
): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "FCWB"
  workbook.created = new Date()

  const used = new Set<string>()

  function addSheet(title: string, columns: string[], rows: string[][]) {
    const sheet = workbook.addWorksheet(sheetName(title, used))
    sheet.addRow(columns)
    sheet.getRow(1).font = { bold: true }
    sheet.views = [{ state: "frozen", ySplit: 1 }]
    for (const row of rows) sheet.addRow(row)
    sheet.columns.forEach((column, index) => {
      const longest = Math.max(
        columns[index]?.length ?? 0,
        ...rows.map((r) => (r[index] ?? "").length),
      )
      column.width = Math.min(Math.max(longest + 2, 10), 44)
    })
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    }
    return sheet
  }

  // --- Blatt 1: der ganze Plan ------------------------------------------
  addSheet(
    t("export.sheetPlan"),
    headers(t),
    [...items].sort(byName).map((item) => rowValues(toRow(item, t))),
  )

  // --- Blatt 2: nur die Wechsel, nach Ziel gebuendelt --------------------
  const buckets = bucketByTargetGroup(items)
  const worklistRows: string[][] = []
  for (const bucket of buckets) {
    for (const item of bucket.items) {
      const row = toRow(item, t)
      worklistRows.push([
        bucket.targetGroup,
        row.lastName,
        row.firstName,
        row.birthYear,
        row.from,
        row.notes,
        "", // Erledigt-Spalte bleibt leer, sie ist zum Abhaken auf Papier
      ])
    }
  }
  addSheet(
    t("export.sheetWorklist"),
    [
      t("export.colTo"),
      t("export.colLastName"),
      t("export.colFirstName"),
      t("export.colBirthYear"),
      t("export.colFrom"),
      t("export.colNotes"),
      t("export.colDone"),
    ],
    worklistRows,
  )

  // --- Ein Blatt pro Team ------------------------------------------------
  const teams = new Set<string>()
  for (const item of items) {
    if (item.targetGroup) teams.add(item.targetGroup)
    for (const group of item.removeGroups) teams.add(group)
  }

  for (const team of [...teams].sort((a, b) => a.localeCompare(b, "de"))) {
    const lower = team.trim().toLowerCase()
    const arrivals = items.filter(
      (i) => i.action === "move" && i.targetGroup?.trim().toLowerCase() === lower,
    )
    const departures = items.filter((i) =>
      i.removeGroups.some((g) => g.trim().toLowerCase() === lower),
    )
    if (arrivals.length === 0 && departures.length === 0) continue

    const rows: string[][] = []
    for (const item of [...arrivals].sort(byName)) {
      const row = toRow(item, t)
      rows.push([t("export.arrival"), row.lastName, row.firstName, row.birthYear, row.from, row.notes])
    }
    for (const item of [...departures].sort(byName)) {
      const row = toRow(item, t)
      rows.push([
        t("export.departure"),
        row.lastName,
        row.firstName,
        row.birthYear,
        row.to || row.status,
        row.notes,
      ])
    }

    addSheet(
      team,
      [
        t("export.colDirection"),
        t("export.colLastName"),
        t("export.colFirstName"),
        t("export.colBirthYear"),
        t("export.colCounterpart"),
        t("export.colNotes"),
      ],
      rows,
    )
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

export function planFileName(season: Season, extension: string): string {
  return `fcwb-gruppenwechsel-${seasonLabel(season).replace("/", "-")}.${extension}`
}

/** Loest den Download aus. Die Datei entsteht im Browser, nichts geht ans Netz. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
