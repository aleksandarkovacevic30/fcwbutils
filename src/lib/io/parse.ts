import Papa from "papaparse"

export type Row = Record<string, string>

/** Rohe Tabelle: Kopfzeile + Datenzeilen, unabhaengig vom Dateiformat. */
export type Sheet = {
  headers: string[]
  rows: Row[]
  /** Name der Quelldatei, nur fuer die Anzeige. */
  fileName: string
}

function normaliseCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) {
    // Excel liefert echte Dates — als ISO normalisieren, ohne Zeitzonen-Drift.
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, "0")
    const d = String(value.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  if (typeof value === "object") {
    // ExcelJS-Zellen koennen { text }, { result } oder { richText } sein.
    const v = value as Record<string, unknown>
    if (typeof v.text === "string") return v.text
    if (v.result !== undefined) return normaliseCell(v.result)
    if (Array.isArray(v.richText)) {
      return v.richText.map((p) => normaliseCell((p as { text?: string }).text)).join("")
    }
    if (typeof v.hyperlink === "string") return v.hyperlink
  }
  return String(value).trim()
}

/** Reiner Text-Pfad, damit CSV-Parsing auch ohne File-API testbar ist. */
export function parseCsvText(text: string, fileName: string): Sheet {
  const result = Papa.parse<Row>(text, {
    header: true,
    skipEmptyLines: "greedy",
    // Gumb/Excel schreiben je nach Gebietsschema `,` oder `;` — Papa erkennt das selbst.
    transformHeader: (h) => h.trim(),
  })
  const rows = (result.data ?? []).map((row) => {
    const clean: Row = {}
    for (const [k, v] of Object.entries(row)) clean[k.trim()] = normaliseCell(v)
    return clean
  })
  const headers = (result.meta.fields ?? []).map((h) => h.trim()).filter(Boolean)
  return { headers, rows: rows.filter((r) => Object.values(r).some(Boolean)), fileName }
}

async function parseCsv(file: File): Promise<Sheet> {
  return parseCsvText(await file.text(), file.name)
}

async function parseXlsx(file: File): Promise<Sheet> {
  // Bewusst dynamisch geladen: ExcelJS ist gross und wird nur gebraucht,
  // wenn wirklich eine .xlsx-Datei kommt.
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error("empty-workbook")

  const headers: string[] = []
  const headerRow = sheet.getRow(1)
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = normaliseCell(cell.value)
  })

  const rows: Row[] = []
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return
    const obj: Row = {}
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = headers[col - 1]
      if (key) obj[key] = normaliseCell(cell.value)
    })
    if (Object.values(obj).some(Boolean)) rows.push(obj)
  })

  return { headers: headers.filter(Boolean), rows, fileName: file.name }
}

export async function parseFile(file: File): Promise<Sheet> {
  const name = file.name.toLowerCase()
  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) return parseXlsx(file)
  if (name.endsWith(".xls")) throw new Error("legacy-xls")
  return parseCsv(file)
}
