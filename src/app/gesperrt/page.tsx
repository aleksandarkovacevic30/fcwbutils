import type { Metadata } from "next"

/**
 * Hinweisseite für alle ohne geteilten Link.
 *
 * Bewusst ein reines Server-Bauteil: kein Zustandsspeicher, keine
 * Übersetzungstabelle, überhaupt kein Anwendungs-JavaScript. Wer hier landet,
 * lädt nichts von der App herunter — und sieht weder Navigation noch einen
 * Hinweis darauf, was dahinter liegt.
 */
export const metadata: Metadata = {
  title: "Nicht öffentlich",
  robots: { index: false, follow: false },
}

export default function LockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <span
          aria-hidden
          className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
        >
          <svg viewBox="0 0 16 16" className="h-6 w-6" fill="currentColor">
            <path d="M8 1a3 3 0 0 0-3 3v2H4.5A1.5 1.5 0 0 0 3 7.5v6A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 11.5 6H11V4a3 3 0 0 0-3-3Zm1.5 5h-3V4a1.5 1.5 0 0 1 3 0v2Z" />
          </svg>
        </span>

        <h1 className="mt-5 text-xl font-semibold tracking-tight">Diese Seite ist nicht öffentlich</h1>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Sie ist nur über einen geteilten Link erreichbar. Wenn du den Link brauchst, frag die
          Person, die dir diese Seite gezeigt hat.
        </p>

        <p className="mt-6 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          This page is not public. It is reachable only through a shared link.
        </p>
      </div>
    </main>
  )
}
