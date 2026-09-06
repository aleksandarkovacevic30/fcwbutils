import { NextResponse, type NextRequest } from "next/server"
import { ACCESS_COOKIE, GATE_COOKIE, KEY_PARAM, decideAccess } from "@/lib/gate"

/** Pfad der Hinweisseite für alle ohne Link. */
const LOCKED_PATH = "/gesperrt"

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export const config = {
  /**
   * Statische Dateien bleiben frei — sonst hätte die Hinweisseite selbst
   * kein CSS. In den Bundles steht ohnehin nichts Vertrauliches: die App
   * ist ein Rechenwerkzeug, die Daten entstehen erst im Browser.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
}

export default async function proxy(request: NextRequest) {
  const decision = await decideAccess({
    configuredKey: process.env.ACCESS_KEY,
    cookieValue: request.cookies.get(ACCESS_COOKIE)?.value,
    providedKey: request.nextUrl.searchParams.get(KEY_PARAM),
  })

  // Die Hinweisseite muss immer erreichbar bleiben, sonst dreht sich das im Kreis.
  if (request.nextUrl.pathname === LOCKED_PATH) return NextResponse.next()

  switch (decision.type) {
    case "open": {
      // Kein Schlüssel gesetzt. Durchlassen, aber sichtbar machen — eine
      // Schranke, von der man fälschlich annimmt, sie sei an, ist schlimmer
      // als gar keine.
      const response = NextResponse.next()
      response.cookies.set(GATE_COOKIE, "open", { sameSite: "lax", path: "/" })
      return response
    }

    case "grant": {
      // Schlüssel aus der Adresszeile entfernen, damit er nicht im Verlauf,
      // in Lesezeichen oder in weitergeleiteten Screenshots landet.
      const clean = request.nextUrl.clone()
      clean.searchParams.delete(KEY_PARAM)
      const response = NextResponse.redirect(clean)
      response.cookies.set(ACCESS_COOKIE, decision.hash, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: YEAR_IN_SECONDS,
      })
      response.cookies.set(GATE_COOKIE, "on", { sameSite: "lax", path: "/" })
      return response
    }

    case "allow": {
      const response = NextResponse.next()
      response.cookies.set(GATE_COOKIE, "on", { sameSite: "lax", path: "/" })
      return response
    }

    case "block": {
      const locked = request.nextUrl.clone()
      locked.pathname = LOCKED_PATH
      locked.search = ""
      const response = NextResponse.rewrite(locked)
      response.headers.set("X-Robots-Tag", "noindex, nofollow")
      return response
    }
  }
}
