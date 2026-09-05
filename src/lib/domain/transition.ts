import { ageInSeason, categoryFor, looksLikeStaff, oldestAge } from "../domain/categories.ts"
import { SKIP, STAY } from "../types.ts"
import type {
  Category,
  Member,
  Season,
  TransitionItem,
  TransitionOverride,
} from "../types.ts"

/** Alle Gruppennamen, die ueberhaupt einer Kategorie zugeordnet sind. */
function managedGroups(categories: Category[]): Map<string, Category> {
  const map = new Map<string, Category>()
  for (const c of categories) {
    for (const g of c.gumbGroups) map.set(g.trim().toLowerCase(), c)
  }
  return map
}

export type TransitionPlan = {
  items: TransitionItem[]
  /** Mitglieder, die in keiner verwalteten Gruppe sind (Trainer, Vorstand, Eltern). */
  unmanaged: Member[]
}

export function computeTransition(
  members: Member[],
  categories: Category[],
  season: Season,
  overrides: Record<string, TransitionOverride> = {},
): TransitionPlan {
  const managed = managedGroups(categories)
  const items: TransitionItem[] = []
  const unmanaged: Member[] = []
  /**
   * Wer deutlich aelter ist als die aelteste Juniorenkategorie, ist keine
   * Person, die "dieses Jahr oben rausfaellt", sondern Trainer:in, Elternteil
   * oder Vorstand. Beim Modell "eine Gemeinschaft pro Team" stehen genau die
   * mit in der Team-Gemeinschaft.
   */
  const adultFrom = oldestAge(categories) + 3

  for (const member of members) {
    // Welche der Gruppen des Mitglieds gehoeren zur Juniorenstruktur?
    const memberManaged = member.groups
      .map((g) => ({ group: g, category: managed.get(g.trim().toLowerCase()) }))
      .filter((x): x is { group: string; category: Category } => Boolean(x.category))

    if (memberManaged.length === 0) {
      unmanaged.push(member)
      continue
    }

    // Betreuungspersonen bleiben unberuehrt, egal in welcher Gemeinschaft sie
    // stehen — weder ihre Rolle noch ihr Alter gehoert in den Wechselplan.
    if (
      looksLikeStaff(member.role) ||
      (member.birthYear !== undefined && ageInSeason(member.birthYear, season) >= adultFrom)
    ) {
      unmanaged.push(member)
      continue
    }

    const reasons: string[] = []
    const currentCategories = [...new Set(memberManaged.map((x) => x.category.id))]

    // --- Fall 1: Jahrgang fehlt -> kann nicht entschieden werden.
    if (!member.birthYear) {
      items.push({
        memberId: member.id,
        member,
        action: "review",
        removeGroups: [],
        reasons: ["reason.noBirthYear"],
      })
      continue
    }

    // --- Fall 2: in mehreren Kategorien gleichzeitig -> immer von Hand.
    if (currentCategories.length > 1) {
      reasons.push("reason.multipleCategories")
    }

    const target = categoryFor(member.birthYear, season, categories, member.gender)

    // --- Fall 3: zu alt fuer die Juniorenstruktur.
    if (!target) {
      items.push({
        memberId: member.id,
        member,
        action: "graduate",
        removeGroups: memberManaged.map((x) => x.group),
        reasons: [...reasons, "reason.tooOld"],
      })
      continue
    }

    const targetGroupsLower = target.gumbGroups.map((g) => g.trim().toLowerCase())
    const alreadyInTarget = memberManaged.find((x) =>
      targetGroupsLower.includes(x.group.trim().toLowerCase()),
    )

    // --- Fall 4: manuelle Korrektur schlaegt die Berechnung.
    const override = overrides[member.id]
    if (override === SKIP) continue
    if (override === STAY) {
      items.push({
        memberId: member.id,
        member,
        action: "stay",
        targetCategory: target,
        removeGroups: [],
        reasons: [...reasons, "reason.manualStay"],
      })
      continue
    }

    // --- Fall 5: bereits in der richtigen Kategorie.
    if (alreadyInTarget && !override) {
      items.push({
        memberId: member.id,
        member,
        action: currentCategories.length > 1 ? "review" : "stay",
        targetCategory: target,
        targetGroup: alreadyInTarget.group,
        // Wer zusaetzlich noch in einer aelteren Kategorie haengt, muss dort raus.
        removeGroups: memberManaged
          .filter((x) => x.category.id !== target.id)
          .map((x) => x.group),
        reasons,
      })
      continue
    }

    // --- Fall 6: echter Wechsel.
    const needsDecision = !override && target.gumbGroups.length > 1
    if (needsDecision) reasons.push("reason.multipleTargetGroups")

    const targetGroup = override ?? target.gumbGroups[0]
    items.push({
      memberId: member.id,
      member,
      action: "move",
      targetCategory: target,
      targetGroup,
      // Die Zielgruppe darf nie in der Entfernen-Liste stehen — sonst steht in
      // der Arbeitsliste "raus aus X, rein in X". Passiert, wenn von Hand eine
      // Gruppe gewaehlt wird, in der das Mitglied schon ist.
      removeGroups: memberManaged
        .map((x) => x.group)
        .filter((g) => g.trim().toLowerCase() !== targetGroup.trim().toLowerCase()),
      reasons,
      needsDecision,
      candidates: target.gumbGroups,
    })
  }

  return { items, unmanaged }
}

/** Arbeitsliste: nach Zielgruppe gebuendelt, damit man in Gumb einmal durchklickt. */
export type WorkBucket = {
  targetGroup: string
  items: TransitionItem[]
}

export function bucketByTargetGroup(items: TransitionItem[]): WorkBucket[] {
  const buckets = new Map<string, TransitionItem[]>()
  for (const item of items) {
    if (item.action !== "move") continue
    const key = item.targetGroup ?? "?"
    const list = buckets.get(key)
    if (list) list.push(item)
    else buckets.set(key, [item])
  }
  return [...buckets.entries()]
    .map(([targetGroup, list]) => ({
      targetGroup,
      items: list.sort((a, b) =>
        `${a.member.lastName} ${a.member.firstName}`.localeCompare(
          `${b.member.lastName} ${b.member.firstName}`,
          "de",
        ),
      ),
    }))
    .sort((a, b) => a.targetGroup.localeCompare(b.targetGroup, "de"))
}

/**
 * Soll-Ist-Vergleich: nach der Handarbeit wird erneut aus Gumb exportiert.
 * Hier pruefen wir, ob jede geplante Verschiebung wirklich angekommen ist.
 */
export type VerifyResult = {
  ok: TransitionItem[]
  missing: { item: TransitionItem; actualGroups: string[] }[]
  notFound: TransitionItem[]
  /** Mitglieder, die im zweiten Export neu dazugekommen sind. */
  added: Member[]
}

export function verifyTransition(
  plan: TransitionItem[],
  after: Member[],
  before: Member[],
): VerifyResult {
  const byId = new Map(after.map((m) => [m.id, m]))
  const ok: TransitionItem[] = []
  const missing: { item: TransitionItem; actualGroups: string[] }[] = []
  const notFound: TransitionItem[] = []

  for (const item of plan) {
    if (item.action !== "move" || !item.targetGroup) continue
    const now = byId.get(item.memberId)
    if (!now) {
      notFound.push(item)
      continue
    }
    const lower = now.groups.map((g) => g.trim().toLowerCase())
    const inTarget = lower.includes(item.targetGroup.trim().toLowerCase())
    const stillInOld = item.removeGroups.some((g) =>
      lower.includes(g.trim().toLowerCase()),
    )
    if (inTarget && !stillInOld) ok.push(item)
    else missing.push({ item, actualGroups: now.groups })
  }

  const beforeIds = new Set(before.map((m) => m.id))
  const added = after.filter((m) => !beforeIds.has(m.id))

  return { ok, missing, notFound, added }
}
