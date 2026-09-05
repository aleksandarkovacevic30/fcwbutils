"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LOCALES } from "@/lib/i18n"
import { useApp } from "@/lib/store"
import type { Locale } from "@/lib/types"
import type { TranslationKey } from "@/lib/i18n"

const NAV: { href: string; key: TranslationKey }[] = [
  { href: "/", key: "nav.home" },
  { href: "/transition", key: "nav.transition" },
  { href: "/roster", key: "nav.roster" },
  { href: "/attendance", key: "nav.attendance" },
  { href: "/settings", key: "nav.settings" },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale, hydrated, storageError } = useApp()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white"
            >
              FC
            </span>
            <span className="text-sm leading-tight font-semibold">
              {t("app.title")}
              <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                {t("app.subtitle")}
              </span>
            </span>
          </Link>

          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:mx-0 md:w-auto">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition ${
                    active
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {t(item.key)}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span
              title={t("app.privacy")}
              className="hidden items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 sm:inline-flex dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <LockIcon />
              {t("app.privacyShort")}
            </span>
            <label className="sr-only" htmlFor="locale">
              {t("settings.language")}
            </label>
            <select
              id="locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {storageError ? (
        <div className="no-print border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Speicher voll — die letzten Änderungen wurden nicht gesichert. ({storageError})
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* Bis localStorage gelesen ist, waere jede Anzeige eine Luege. */}
        {hydrated ? children : <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-900" />}
      </main>

      <footer className="no-print border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {t("app.privacy")}
      </footer>
    </div>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="currentColor">
      <path d="M8 1a3 3 0 0 0-3 3v2H4.5A1.5 1.5 0 0 0 3 7.5v6A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 11.5 6H11V4a3 3 0 0 0-3-3Zm1.5 5h-3V4a1.5 1.5 0 0 1 3 0v2Z" />
    </svg>
  )
}
