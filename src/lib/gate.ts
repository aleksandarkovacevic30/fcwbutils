/**
 * Zugangsschranke per geteiltem Link.
 *
 * Was das ist: ein Riegel gegen zufaellige Besucher und Suchmaschinen. Wer den
 * Link hat, kommt rein; wer nicht, sieht eine Hinweisseite.
 *
 * Was das *nicht* ist: ein Schutz personenbezogener Daten. Links wandern weiter
 * — im Browserverlauf, in weitergeleiteten Mails, in geteilten Geraeten. Der
 * eigentliche Datenschutz dieser App liegt woanders und ist staerker: auf dem
 * Server liegen ueberhaupt keine Mitgliederdaten. Alles bleibt im Browser der
 * jeweiligen Person. Wer den Link errät, findet ein leeres Werkzeug vor.
 */

/** Cookie mit dem Hash des Schluessels. Wird von der Proxy-Schicht gesetzt. */
export const ACCESS_COOKIE = "fcwb_access"
/** Verrät der Oberfläche, ob überhaupt eine Schranke aktiv ist. */
export const GATE_COOKIE = "fcwb_gate"
/** Query-Parameter im geteilten Link: ?key=... */
export const KEY_PARAM = "key"

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Vergleich ohne frühen Abbruch. Bei einem Hash-Vergleich ist das eher
 * Sorgfalt als Notwendigkeit, kostet aber nichts.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export type GateDecision =
  /** Kein Schlüssel konfiguriert — die Seite ist offen, und das soll man sehen. */
  | { type: "open" }
  /** Gültiges Cookie, normal weiter. */
  | { type: "allow" }
  /** Gültiger Schlüssel in der URL: Cookie setzen und den Schlüssel aus der Adresse räumen. */
  | { type: "grant"; hash: string }
  /** Hinweisseite. */
  | { type: "block" }

export async function decideAccess(input: {
  configuredKey?: string | null
  cookieValue?: string | null
  providedKey?: string | null
}): Promise<GateDecision> {
  const configured = input.configuredKey?.trim()
  if (!configured) return { type: "open" }

  const expected = await sha256Hex(configured)

  // Der Link zuerst: so kommt auch jemand rein, dessen Cookie abgelaufen ist
  // oder der einen neuen Schlüssel bekommen hat.
  const provided = input.providedKey?.trim()
  if (provided && safeEqual(await sha256Hex(provided), expected)) {
    return { type: "grant", hash: expected }
  }

  const cookie = input.cookieValue?.trim()
  if (cookie && safeEqual(cookie, expected)) return { type: "allow" }

  return { type: "block" }
}
