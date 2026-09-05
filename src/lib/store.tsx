"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { DEFAULT_CATEGORIES, defaultSeason } from "./domain/categories.ts"
import { DEFAULT_JUS } from "./domain/jus.ts"
import { translate, type TranslationKey } from "./i18n.ts"
import type { AppState, Locale } from "./types.ts"

const STORAGE_KEY = "fcwb-tools-v1"

export function emptyState(): AppState {
  return {
    version: 1,
    locale: "de",
    season: defaultSeason(),
    categories: DEFAULT_CATEGORIES,
    // Der FCWB fuehrt pro Team eine eigene Gumb-Gemeinschaft.
    structure: "communities",
    sources: [],
    verifySources: [],
    members: [],
    verifyMembers: null,
    worklistProgress: {},
    overrides: {},
    attendance: [],
    jus: DEFAULT_JUS,
  }
}

/**
 * Sanft validieren statt blind vertrauen: die Daten kommen aus localStorage
 * oder aus einer Backup-Datei, beides kann veraltet oder kaputt sein.
 */
export function reviveState(input: unknown): AppState | null {
  if (!input || typeof input !== "object") return null
  const raw = input as Partial<AppState>
  if (raw.version !== 1) return null
  const base = emptyState()
  return {
    version: 1,
    locale: raw.locale === "en" ? "en" : "de",
    season: raw.season && typeof raw.season.startYear === "number" ? raw.season : base.season,
    categories: Array.isArray(raw.categories) && raw.categories.length ? raw.categories : base.categories,
    structure: raw.structure === "groups" ? "groups" : "communities",
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    verifySources: Array.isArray(raw.verifySources) ? raw.verifySources : [],
    members: Array.isArray(raw.members) ? raw.members : [],
    verifyMembers: Array.isArray(raw.verifyMembers) ? raw.verifyMembers : null,
    worklistProgress: raw.worklistProgress ?? {},
    overrides: raw.overrides ?? {},
    attendance: Array.isArray(raw.attendance) ? raw.attendance : [],
    jus: { ...base.jus, ...(raw.jus ?? {}) },
  }
}

/**
 * Vor dem Speichern die Rohzeilen der Anwesenheitsdaten entfernen — die
 * brauchen wir nach dem Import nicht mehr und sie sprengen sonst das
 * 5-MB-Limit von localStorage.
 */
function forStorage(state: AppState): AppState {
  return {
    ...state,
    attendance: state.attendance.map((row) => ({ ...row, raw: {} })),
  }
}

type Ctx = {
  state: AppState
  update: (patch: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) => void
  reset: () => void
  replaceState: (next: AppState) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  locale: Locale
  setLocale: (locale: Locale) => void
  /** false, solange localStorage noch nicht gelesen wurde (SSR-sicher). */
  hydrated: boolean
  /** Gesetzt, wenn localStorage voll ist — sonst verliert man Daten stillschweigend. */
  storageError: string | null
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState)
  const [hydrated, setHydrated] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)
  const saveTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const revived = reviveState(JSON.parse(stored))
        if (revived) setState(revived)
      }
    } catch {
      // Kaputter Eintrag: lieber leer starten als die App blockieren.
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(forStorage(state)))
        setStorageError(null)
      } catch (error) {
        setStorageError(error instanceof Error ? error.message : String(error))
      }
    }, 250)
    return () => window.clearTimeout(saveTimer.current)
  }, [state, hydrated])

  useEffect(() => {
    document.documentElement.lang = state.locale
  }, [state.locale])

  const update = useCallback<Ctx["update"]>((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }))
  }, [])

  const reset = useCallback(() => {
    const fresh = emptyState()
    setState((prev) => ({ ...fresh, locale: prev.locale }))
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* nichts zu tun */
    }
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      state,
      update,
      reset,
      replaceState: setState,
      t: (key, vars) => translate(state.locale, key, vars),
      locale: state.locale,
      setLocale: (locale) => update({ locale }),
      hydrated,
      storageError,
    }),
    [state, update, reset, hydrated, storageError],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>")
  return ctx
}
