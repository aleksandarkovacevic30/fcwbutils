"use client"

import Link from "next/link"
import { useApp } from "@/lib/store"
import type { TranslationKey } from "@/lib/i18n"

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`print-plain rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </section>
  )
}

export function PageHeader({
  title,
  lead,
  actions,
}: {
  title: string
  lead?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {lead ? (
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{lead}</p>
        ) : null}
      </div>
      {actions ? <div className="no-print flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost"
}

const BUTTON_STYLES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/50",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
}

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_STYLES[variant]} ${className}`}
    />
  )
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "good" | "bad" | "warn" }) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "bad"
        ? "text-rose-700 dark:text-rose-400"
        : tone === "warn"
          ? "text-amber-700 dark:text-amber-400"
          : ""
  return (
    <div className="print-plain rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`tnum mt-0.5 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

const SEVERITY_STYLES = {
  error: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  info: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300",
} as const

export function SeverityBadge({ severity }: { severity: keyof typeof SEVERITY_STYLES }) {
  const { t } = useApp()
  const label = t(`common.${severity === "error" ? "error" : severity === "warning" ? "warning" : "info"}` as TranslationKey)
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[severity]}`}>
      {label}
    </span>
  )
}

/** Wird auf jeder Seite gebraucht, die ohne Mitgliederdaten nichts anzeigen kann. */
export function NeedsData({ href = "/transition" }: { href?: string }) {
  const { t } = useApp()
  return (
    <Card className="text-center">
      <p className="text-sm text-slate-600 dark:text-slate-400">{t("common.needsData")}</p>
      <Link
        href={href}
        className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        {t("common.goImport")}
      </Link>
    </Card>
  )
}

export function PrintButton() {
  const { t } = useApp()
  return (
    <Button onClick={() => window.print()} variant="secondary">
      {t("common.print")}
    </Button>
  )
}
