import type { Metadata, Viewport } from "next"
import "./globals.css"

/**
 * Wurzel-Layout: nur Dokument und Stylesheet.
 *
 * Kopfzeile, Navigation und der Zustandsspeicher liegen bewusst eine Ebene
 * tiefer in der Routen-Gruppe "(app)". Die Hinweisseite unter /gesperrt hängt
 * damit gar nicht erst an diesem Baum — sie kann die Navigation also auch
 * dann nicht zeigen, wenn die Proxy-Schicht sie unter einer anderen Adresse
 * ausliefert.
 */
export const metadata: Metadata = {
  title: "FCWB Werkzeuge",
  description:
    "Werkzeuge für den FC Bonstetten-Wettswil rund um den Gumb-Export. Alle Daten bleiben im Browser.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
