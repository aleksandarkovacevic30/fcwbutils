import type { Member } from "../types.ts"

/**
 * Beim FCWB ist jedes Team eine eigene Gumb-Gemeinschaft. Es gibt also nicht
 * einen Export, sondern einen pro Team — und die aktuelle Kategorie eines Kindes
 * steht nirgends in der Datei, sondern ergibt sich daraus, aus welcher Datei es
 * stammt.
 *
 * Diese Funktion schreibt den Gemeinschaftsnamen in `groups`. Damit sieht der
 * Rest der App (Kategorienzuordnung, Wechselplan, Datencheck) keinen Unterschied
 * zum Gruppen-Modell — die Fachlogik bleibt dieselbe.
 */
export function tagWithCommunity(members: Member[], community: string): Member[] {
  const name = community.trim()
  return members.map((m) => ({ ...m, groups: name ? [name] : [] }))
}

/** Nimmt den ersten nicht-leeren Wert. Spaeter Importiertes fuellt nur Luecken. */
function firstOf<T>(a: T | undefined, b: T | undefined): T | undefined {
  return a === undefined || a === "" ? b : a
}

/**
 * Fuehrt mehrere Exporte zu einer Mitgliederliste zusammen. Wer in zwei
 * Gemeinschaften steht (spielt eine Kategorie hoch mit), bekommt beide Namen in
 * `groups` — und faellt damit im Plan korrekt als "bitte pruefen" auf.
 */
export function mergeMembers(existing: Member[], incoming: Member[]): Member[] {
  const byId = new Map(existing.map((m) => [m.id, { ...m, groups: [...m.groups] }]))

  for (const member of incoming) {
    const current = byId.get(member.id)
    if (!current) {
      byId.set(member.id, { ...member, groups: [...member.groups] })
      continue
    }
    const groups = [...current.groups]
    for (const group of member.groups) {
      if (!groups.some((g) => g.trim().toLowerCase() === group.trim().toLowerCase())) {
        groups.push(group)
      }
    }
    byId.set(member.id, {
      ...current,
      groups,
      birthDate: firstOf(current.birthDate, member.birthDate),
      birthYear: firstOf(current.birthYear, member.birthYear),
      gender: firstOf(current.gender, member.gender),
      email: firstOf(current.email, member.email),
      phone: firstOf(current.phone, member.phone),
      ahv: firstOf(current.ahv, member.ahv),
      role: firstOf(current.role, member.role),
      // Die Rohzeilen der weiteren Exporte werden zusammengelegt, damit nichts
      // verloren geht, was nur in einer der Dateien stand.
      raw: { ...member.raw, ...current.raw },
    })
  }

  return [...byId.values()]
}

/**
 * Entfernt einen Export wieder. Weil der Gemeinschaftsname in `groups` steht,
 * genuegt es, ihn dort zu streichen — wer danach in keiner Gemeinschaft mehr
 * steht, war nur in dieser Datei und fliegt raus.
 */
export function removeCommunity(members: Member[], community: string): Member[] {
  const name = community.trim().toLowerCase()
  return members
    .map((m) => ({ ...m, groups: m.groups.filter((g) => g.trim().toLowerCase() !== name) }))
    .filter((m) => m.groups.length > 0)
}

/** Vorschlag fuer den Gemeinschaftsnamen aus dem Dateinamen. */
export function communityNameFromFile(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_]+/g, " ")
    // Gumb haengt an Exporte gern ein Datum an — das gehoert nicht in den Namen.
    .replace(/\s*\d{4}-\d{2}-\d{2}\s*/g, " ")
    .replace(/\s*\d{1,2}\.\d{1,2}\.\d{2,4}\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}
