/**
 * Die Zugangsschranke entscheidet, wer die Seite ueberhaupt sieht. Sie ist
 * kurz genug, dass man sie fuer offensichtlich haelt — und genau darum
 * geprueft.
 */
import assert from "node:assert/strict"
import { decideAccess, safeEqual, sha256Hex } from "../src/lib/gate.ts"

let passed = 0
async function ok(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    passed++
    console.log("  PASS  " + name)
  } catch (e) {
    console.log("  FAIL  " + name + "\n        " + (e as Error).message)
    process.exitCode = 1
  }
}

const KEY = "s3cret-link-key"

console.log("\n== Bausteine ==")
await ok("sha256Hex ist stabil und 64 Zeichen lang", async () => {
  const a = await sha256Hex(KEY)
  const b = await sha256Hex(KEY)
  assert.equal(a, b)
  assert.equal(a.length, 64)
  assert.notEqual(a, await sha256Hex(KEY + "x"))
})
await ok("safeEqual vergleicht korrekt", () => {
  assert.equal(safeEqual("abc", "abc"), true)
  assert.equal(safeEqual("abc", "abd"), false)
  assert.equal(safeEqual("abc", "ab"), false)
  assert.equal(safeEqual("", ""), true)
})

console.log("\n== Ohne konfigurierten Schluessel ==")
await ok("kein Schluessel -> offen, nicht etwa gesperrt", async () => {
  assert.deepEqual(await decideAccess({}), { type: "open" })
  assert.deepEqual(await decideAccess({ configuredKey: "" }), { type: "open" })
  assert.deepEqual(await decideAccess({ configuredKey: "   " }), { type: "open" })
  assert.deepEqual(await decideAccess({ configuredKey: null }), { type: "open" })
})
await ok("offen heisst offen, auch mit falschem Cookie", async () => {
  const d = await decideAccess({ configuredKey: undefined, cookieValue: "muell" })
  assert.equal(d.type, "open")
})

console.log("\n== Mit konfiguriertem Schluessel ==")
await ok("ohne alles -> gesperrt", async () => {
  assert.deepEqual(await decideAccess({ configuredKey: KEY }), { type: "block" })
})
await ok("richtiger Schluessel im Link -> Zugang wird erteilt", async () => {
  const d = await decideAccess({ configuredKey: KEY, providedKey: KEY })
  assert.equal(d.type, "grant")
  assert.equal(d.type === "grant" && d.hash, await sha256Hex(KEY))
})
await ok("falscher Schluessel im Link -> gesperrt", async () => {
  const d = await decideAccess({ configuredKey: KEY, providedKey: "falsch" })
  assert.equal(d.type, "block")
})
await ok("gueltiges Cookie -> durchlassen", async () => {
  const d = await decideAccess({ configuredKey: KEY, cookieValue: await sha256Hex(KEY) })
  assert.equal(d.type, "allow")
})
await ok("Cookie mit dem Klartext-Schluessel genuegt nicht", async () => {
  // Im Cookie steht der Hash, nicht der Schluessel. Wer nur den Schluessel
  // kennt, muss ihn ueber den Link einloesen.
  const d = await decideAccess({ configuredKey: KEY, cookieValue: KEY })
  assert.equal(d.type, "block")
})
await ok("veraltetes Cookie -> gesperrt", async () => {
  const d = await decideAccess({ configuredKey: KEY, cookieValue: await sha256Hex("alter-key") })
  assert.equal(d.type, "block")
})
await ok("der Link schlaegt ein veraltetes Cookie", async () => {
  // Nach einem Schluesselwechsel soll der neue Link sofort wirken, ohne dass
  // jemand erst Cookies loeschen muss.
  const d = await decideAccess({
    configuredKey: KEY,
    cookieValue: await sha256Hex("alter-key"),
    providedKey: KEY,
  })
  assert.equal(d.type, "grant")
})
await ok("Leerzeichen um den Schluessel stoeren nicht", async () => {
  // Beim Kopieren aus einer Mail haengt gern ein Leerzeichen dran.
  const d = await decideAccess({ configuredKey: ` ${KEY} `, providedKey: KEY })
  assert.equal(d.type, "grant")
})
await ok("leerer Schluessel im Link oeffnet nichts", async () => {
  assert.equal((await decideAccess({ configuredKey: KEY, providedKey: "" })).type, "block")
  assert.equal((await decideAccess({ configuredKey: KEY, providedKey: "  " })).type, "block")
})
await ok("Praefix des richtigen Schluessels genuegt nicht", async () => {
  const d = await decideAccess({ configuredKey: KEY, providedKey: KEY.slice(0, -1) })
  assert.equal(d.type, "block")
})

console.log("\n" + passed + " Pruefungen bestanden.\n")
