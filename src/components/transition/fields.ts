import type { ImportField } from "@/components/import-panel"

/** Spalten, die die App im Mitglieder-Export sucht. */
export const MEMBER_FIELDS: ImportField[] = [
  { key: "firstName", labelKey: "field.firstName", required: true },
  { key: "lastName", labelKey: "field.lastName", required: true },
  { key: "fullName", labelKey: "field.fullName", required: true },
  { key: "birthDate", labelKey: "field.birthDate" },
  { key: "birthYear", labelKey: "field.birthYear" },
  { key: "groups", labelKey: "field.groups" },
  { key: "gender", labelKey: "field.gender" },
  { key: "email", labelKey: "field.email" },
  { key: "phone", labelKey: "field.phone" },
  { key: "ahv", labelKey: "field.ahv" },
  { key: "role", labelKey: "field.role" },
  { key: "id", labelKey: "field.id" },
]

/** Spalten im Export "Anwesenheitskontrolle". */
export const ATTENDANCE_FIELDS: ImportField[] = [
  { key: "firstName", labelKey: "field.firstName", required: true },
  { key: "lastName", labelKey: "field.lastName", required: true },
  { key: "status", labelKey: "field.status" },
  { key: "eventId", labelKey: "field.eventId" },
  { key: "date", labelKey: "field.date" },
  { key: "start", labelKey: "field.start" },
  { key: "end", labelKey: "field.end" },
  { key: "birthDate", labelKey: "field.birthDate" },
  { key: "ahv", labelKey: "field.ahv" },
]
