import type { Metadata, Viewport } from "next"
import { AppProvider } from "@/lib/store"
import { Shell } from "@/components/shell"
import "./globals.css"

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
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  )
}
