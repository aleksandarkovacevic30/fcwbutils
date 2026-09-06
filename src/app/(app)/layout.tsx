import { AppProvider } from "@/lib/store"
import { Shell } from "@/components/shell"

/**
 * Alles, was zur eigentlichen Anwendung gehört: Zustandsspeicher, Kopfzeile,
 * Navigation. Wer die Zugangsschranke nicht passiert hat, kommt hier nie an.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Shell>{children}</Shell>
    </AppProvider>
  )
}
