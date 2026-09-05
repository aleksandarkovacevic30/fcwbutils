import type { Locale } from "./types.ts"

const de = {
  "app.title": "FCWB Werkzeuge",
  "app.subtitle": "Helferlein für den FC Bonstetten-Wettswil",
  "app.privacy":
    "Alle Daten bleiben in diesem Browser. Nichts wird hochgeladen, nichts landet auf einem Server.",
  "app.privacyShort": "Daten bleiben lokal",

  "nav.home": "Übersicht",
  "nav.transition": "Gruppenwechsel",
  "nav.roster": "Datencheck",
  "nav.attendance": "J+S-Kontrolle",
  "nav.settings": "Einstellungen",

  "home.lead":
    "Drei Werkzeuge rund um den Gumb-Export. Du exportierst aus Gumb, arbeitest hier, und trägst das Ergebnis in Gumb nach.",
  "home.transitionDesc":
    "Berechnet aus den Jahrgängen, welches Kind zur neuen Saison in welche Gruppe gehört — und gibt dir eine abhakbare Klickliste für Gumb.",
  "home.rosterDesc":
    "Findet Doppeleinträge, fehlende Jahrgänge, fehlende Kontaktangaben und Kinder ohne Gruppe.",
  "home.attendanceDesc":
    "Prüft den Anwesenheits-Export gegen die J+S-Vorgaben, bevor er in die Nationale Datenbank Sport geht.",
  "home.noApi":
    "Gumb hat keine öffentliche Schnittstelle. Diese App nimmt dir das Rechnen und Prüfen ab — die Änderungen selbst klickst du weiterhin in Gumb.",
  "home.start": "Öffnen",
  "home.dataLoaded": "{n} Mitglieder geladen",
  "home.noData": "Noch keine Daten",

  "import.title": "Gumb-Export einlesen",
  "import.hint":
    "In Gumb: Gemeinschaftseinstellungen → Mitglieder → Export. CSV oder Excel, beides geht.",
  "import.attendanceHint": "In Gumb: Statistik & Exporte → Anwesenheitskontrolle herunterladen.",
  "import.drop": "Datei hierhin ziehen oder klicken",
  "import.dropMany": "Dateien hierhin ziehen oder klicken — alle Teams auf einmal",
  "import.files": "Dateien",
  "import.fileCount": "{n} Dateien",
  "import.headerMismatch":
    "Diese Dateien haben andere Spalten als die erste: {names}. Die Zuordnung unten gilt für alle — bitte prüfen.",
  "import.errorDuplicateNames":
    "Zwei Dateien tragen denselben Gemeinschaftsnamen. Sie würden sich gegenseitig ersetzen.",
  "import.formats": "CSV, XLSX",
  "import.reading": "Wird gelesen …",
  "import.rows": "{n} Zeilen, {c} Spalten",
  "import.mapping": "Spaltenzuordnung",
  "import.mappingHint": "Automatisch erkannt. Stimmt etwas nicht, hier korrigieren.",
  "import.none": "— nicht vorhanden —",
  "import.apply": "Übernehmen",
  "import.replaceWarning":
    "Damit werden die aktuell geladenen Mitglieder ersetzt. Der Fortschritt in der Arbeitsliste bleibt erhalten.",
  "import.errorLegacy":
    "Altes .xls-Format wird nicht unterstützt. Bitte in Gumb als CSV oder XLSX exportieren.",
  "import.errorGeneric": "Datei konnte nicht gelesen werden: {msg}",
  "import.errorNoCommunity":
    "Bitte den Namen der Gemeinschaft angeben — sonst ist nicht erkennbar, aus welchem Team der Export stammt.",
  "import.errorNoName":
    "In der Zuordnung fehlt der Name. Ohne Vor-/Nachname (oder eine Namensspalte) geht es nicht.",

  "field.id": "Gumb-ID",
  "field.firstName": "Vorname",
  "field.lastName": "Nachname",
  "field.fullName": "Name (kombiniert)",
  "field.birthDate": "Geburtsdatum",
  "field.birthYear": "Jahrgang",
  "field.gender": "Geschlecht",
  "field.email": "E-Mail",
  "field.phone": "Telefon",
  "field.groups": "Gruppen",
  "field.role": "Rolle",
  "field.ahv": "AHV-Nummer",
  "field.eventId": "Event-ID",
  "field.date": "Datum",
  "field.start": "Startzeit",
  "field.end": "Endzeit",
  "field.status": "Anwesenheitsstatus",

  "trans.title": "Gruppenwechsel zur neuen Saison",
  "trans.lead":
    "Jedes Kind rückt zur neuen Saison eine Alterskategorie auf. Diese Seite rechnet aus, wer wohin muss, und macht daraus eine Klickliste.",
  "trans.step1": "1 · Export einlesen",
  "trans.step2": "2 · Gruppen zuordnen",
  "trans.step3": "3 · Plan prüfen",
  "trans.step4": "4 · Arbeitsliste abarbeiten",
  "trans.step5": "5 · Kontrolle",
  "trans.season": "Saison",
  "trans.mapGroupsLead":
    "Diese Gruppennamen stehen im Export. Ordne sie den Alterskategorien zu — nur zugeordnete Gruppen werden im Plan berücksichtigt.",
  "trans.unassigned": "Nicht zugeordnet",
  "trans.step1Communities": "1 · Exporte einlesen (einer pro Team)",
  "trans.step2Communities": "2 · Gemeinschaften zuordnen",
  "trans.mapCommunitiesLead":
    "Diese Gemeinschaften hast du eingelesen. Ordne sie den Alterskategorien zu — nur zugeordnete Gemeinschaften kommen in den Plan.",
  "trans.communityName": "Name der Gemeinschaft",
  "trans.communityNameHint":
    "Aus dem Dateinamen vorgeschlagen. So heisst das Team später im Plan und in der Arbeitsliste.",
  "trans.sources": "Eingelesene Exporte",
  "trans.sourcesLead":
    "Jedes Team ist in Gumb eine eigene Gemeinschaft, also brauchst du pro Team einen Export. Lies sie nacheinander ein — sie werden zusammengeführt.",
  "trans.sourcesEmpty": "Noch nichts eingelesen.",
  "trans.sourceRemove": "Entfernen",
  "trans.sourceCount": "{n} Mitglieder",
  "trans.addSource": "Weiteren Export hinzufügen",
  "trans.clearSources": "Alle Exporte verwerfen",
  "trans.duplicateSource":
    "«{name}» wurde bereits eingelesen. Beim erneuten Einlesen wird der bisherige Stand dieser Gemeinschaft ersetzt.",
  "trans.worklistLeadCommunities":
    "Nach Zielgemeinschaft gebündelt. In Gumb: Profil → «Meine Gemeinschaften» → Matrix, dort die Person suchen und in der Zeile der Zielgemeinschaft hinzufügen. Das Entfernen aus der alten Gemeinschaft ist ein zweiter Schritt in deren Mitgliederliste.",
  "trans.matrixStep1": "Matrix: hinzufügen zu",
  "trans.matrixStep2": "Danach entfernen aus",
  "trans.verifyLeadCommunities":
    "Wenn du in Gumb fertig bist: alle Team-Exporte nochmals herunterladen und hier einlesen. Dann siehst du sofort, ob jedes Kind angekommen — und aus der alten Gemeinschaft verschwunden — ist.",
  "trans.groupCount": "{n} Personen",
  "trans.planSummary":
    "{move} Wechsel, {stay} bleiben, {graduate} fallen oben raus, {review} zum Prüfen",
  "trans.action.move": "Wechselt",
  "trans.action.stay": "Bleibt",
  "trans.action.graduate": "Fällt raus",
  "trans.action.review": "Prüfen",
  "trans.from": "von",
  "trans.to": "nach",
  "trans.worklist": "Arbeitsliste für Gumb",
  "trans.worklistLead":
    "Nach Zielgruppe gebündelt. In Gumb: Gemeinschaftseinstellungen → Mitglieder → Spalte «Gruppen». Arbeite eine Zielgruppe komplett ab, dann die nächste.",
  "trans.worklistEmpty": "Keine Wechsel nötig.",
  "trans.done": "{done} von {total} erledigt",
  "trans.resetProgress": "Fortschritt zurücksetzen",
  "trans.remove": "entfernen aus",
  "trans.add": "hinzufügen zu",
  "trans.override": "Zielgruppe",
  "trans.overrideStay": "Bleibt, wo es ist",
  "trans.overrideSkip": "Nicht bearbeiten",
  "trans.overrideAuto": "Automatisch",
  "trans.resetOverrides": "Korrekturen zurücksetzen",
  "trans.unmanaged":
    "{n} Personen sind in keiner zugeordneten Gruppe (Trainer, Vorstand, Eltern) und bleiben unberührt.",
  "trans.verifyLead":
    "Wenn du in Gumb fertig bist: dort nochmals exportieren und die neue Datei hier einlesen. Dann siehst du sofort, ob alles angekommen ist.",
  "trans.verifyUpload": "Kontroll-Export einlesen",
  "trans.verifyOk": "{n} Wechsel korrekt übernommen",
  "trans.verifyMissing": "{n} Wechsel fehlen noch",
  "trans.verifyNotFound": "{n} Personen im neuen Export nicht gefunden",
  "trans.verifyAdded": "{n} Personen sind neu dazugekommen",
  "trans.verifyPerfect": "Alles übernommen. Der Saisonwechsel ist durch.",
  "trans.verifyIncomplete":
    "Für die Kontrolle fehlen noch die Exporte dieser Gemeinschaften: {names}. Solange sie fehlen, sieht ein angekommenes Kind aus wie ein verlorenes.",
  "trans.actualGroups": "Aktuell",

  "reason.noBirthYear": "Kein Jahrgang im Export",
  "reason.multipleCategories": "In mehreren Alterskategorien gleichzeitig",
  "reason.tooOld": "Zu alt für die Juniorenstruktur",
  "reason.multipleTargetGroups": "Zielkategorie hat mehrere Gruppen — bitte wählen",
  "reason.manualStay": "Von Hand auf «bleibt» gesetzt",

  "export.xlsx": "Excel (.xlsx)",
  "export.csv": "CSV",
  "export.note":
    "Gumb kann keine Mitglieder importieren — diese Dateien sind Arbeitsunterlagen zum Abarbeiten und Weitergeben, keine Import-Vorlage.",
  "export.sheetPlan": "Plan",
  "export.sheetWorklist": "Arbeitsliste",
  "export.colLastName": "Nachname",
  "export.colFirstName": "Vorname",
  "export.colBirthYear": "Jahrgang",
  "export.colStatus": "Status",
  "export.colFrom": "Von",
  "export.colTo": "Nach",
  "export.colNotes": "Hinweise",
  "export.colDone": "Erledigt",
  "export.colDirection": "Richtung",
  "export.colCounterpart": "Gegenseite",
  "export.arrival": "Zugang",
  "export.departure": "Abgang",

  "roster.title": "Datencheck",
  "roster.lead":
    "Die Probleme, die den Saisonwechsel und die J+S-Abrechnung stolpern lassen — bevor sie es tun.",
  "roster.clean": "Keine Probleme gefunden.",
  "roster.affected": "{n} betroffen",
  "roster.showAll": "Alle anzeigen",
  "roster.showLess": "Weniger",

  "rule.duplicateName": "Doppelter Eintrag (gleicher Name, gleicher Jahrgang)",
  "rule.sameNameDifferentYear": "Gleicher Name, anderer Jahrgang (vermutlich Geschwister)",
  "rule.sharedEmail": "Mehrere Mitglieder teilen sich eine E-Mail-Adresse",
  "rule.missingBirthYear": "Jahrgang fehlt — Gruppenwechsel nicht berechenbar",
  "rule.missingBirthDate": "Nur Jahrgang, kein volles Geburtsdatum — J+S verlangt das Datum",
  "rule.noGroup": "In keiner Gruppe",
  "rule.noContact": "Weder E-Mail noch Telefon hinterlegt",
  "rule.invalidEmail": "E-Mail-Adresse sieht ungültig aus",
  "rule.invalidAhv": "AHV-Nummer hat nicht das Format 756.xxxx.xxxx.xx",
  "rule.implausibleBirthYear": "Unplausibler Jahrgang",
  "rule.multipleCategories": "In mehreren Alterskategorien gleichzeitig",
  "rule.categoryMismatch": "Gruppe passt nicht zum Jahrgang der gewählten Saison",

  "jus.title": "J+S-Anwesenheitskontrolle",
  "jus.lead":
    "Prüft den Gumb-Export, bevor er in die Nationale Datenbank Sport geht. Gefunden wird, was dort zu Rückweisungen oder nicht abrechenbaren Aktivitäten führt.",
  "jus.activities": "Aktivitäten",
  "jus.participants": "Teilnehmende",
  "jus.presentTotal": "Anwesenheiten",
  "jus.clean": "Keine Beanstandungen.",
  "jus.settings": "Prüfregeln",
  "jus.minParticipants": "Mindestteilnehmende pro Aktivität",
  "jus.ageRange": "Zulässiges Alter",
  "jus.requireAhv": "AHV-Nummer als Pflichtfeld prüfen",
  "jus.perParticipant": "Pro Teilnehmer:in",
  "jus.presentCount": "Anwesend",
  "jus.listedCount": "Aufgeführt",
  "jus.rate": "Quote",
  "jus.tooFewParticipants":
    "Aktivität mit weniger als der Mindestzahl anwesender Teilnehmender — nicht abrechenbar",
  "jus.missingDate": "Aktivität ohne Datum",
  "jus.missingTimes": "Aktivität ohne verwertbare Start-/Endzeit",
  "jus.missingAhv": "AHV-Nummer fehlt",
  "jus.missingBirthDate": "Geburtsdatum fehlt",
  "jus.outsideAgeRange": "Ausserhalb der J+S-Altersspanne zum Zeitpunkt der Aktivität",
  "jus.multiplePerDay": "Mehrfach am selben Tag anwesend — J+S vergütet nur die längere Aktivität",
  "jus.disclaimer":
    "Die Schwellenwerte sind hier einstellbar. Verbindlich sind die aktuellen Weisungen des BASPO.",

  "settings.title": "Einstellungen",
  "settings.categories": "Alterskategorien",
  "settings.categoriesLead":
    "Alter = Saisonstartjahr − Jahrgang. Für die Saison {season} ergibt das die angezeigten Jahrgänge.",
  "settings.disclaimer":
    "Voreinstellung nach SFV/FVRZ. Vor jedem Saisonwechsel mit den aktuellen Ausführungsbestimmungen abgleichen.",
  "settings.categoryName": "Kategorie",
  "settings.ageFrom": "Alter von",
  "settings.ageTo": "bis",
  "settings.years": "Jahrgänge",
  "settings.groups": "Gumb-Gruppen (kommagetrennt)",
  "settings.communities": "Gumb-Gemeinschaften (kommagetrennt)",
  "settings.structure": "Aufbau in Gumb",
  "settings.structureLead":
    "Davon hängt ab, woher die aktuelle Kategorie eines Kindes kommt und wie in Gumb verschoben wird.",
  "settings.structureCommunities": "Eine Gemeinschaft pro Team",
  "settings.structureCommunitiesHint":
    "So macht es der FCWB. Pro Team ein Export; verschoben wird über die Mitglieder-Matrix.",
  "settings.structureGroups": "Eine Gemeinschaft, Teams sind Gruppen",
  "settings.structureGroupsHint":
    "Ein einziger Export mit einer Gruppen-Spalte; verschoben wird über das Dropdown im Mitglieder-Tab.",
  "settings.structureWarning":
    "Beim Umstellen werden die eingelesenen Mitglieder verworfen — die beiden Modelle lesen dieselbe Datei unterschiedlich.",
  "settings.femaleExtra": "Juniorinnen ein Jahr älter erlaubt",
  "settings.addCategory": "Kategorie hinzufügen",
  "settings.resetCategories": "Auf Standard zurücksetzen",
  "settings.backup": "Sicherung",
  "settings.backupLead":
    "Weil nichts auf einem Server liegt, ist die Sicherung deine Verantwortung. Die Datei enthält Personendaten — behandle sie entsprechend.",
  "settings.download": "Sicherung herunterladen",
  "settings.restore": "Sicherung einlesen",
  "settings.danger": "Alle Daten löschen",
  "settings.dangerLead":
    "Löscht Mitglieder, Anwesenheiten und Fortschritt aus diesem Browser. Nicht rückgängig zu machen.",
  "settings.dangerConfirm": "Wirklich alle lokalen Daten löschen?",
  "settings.language": "Sprache",
  "settings.restored": "Sicherung eingelesen.",
  "settings.restoreFailed": "Datei ist keine gültige Sicherung.",

  "common.members": "Mitglieder",
  "common.search": "Suchen",
  "common.print": "Drucken / PDF",
  "common.close": "Schliessen",
  "common.cancel": "Abbrechen",
  "common.delete": "Löschen",
  "common.name": "Name",
  "common.year": "Jahrgang",
  "common.group": "Gruppe",
  "common.category": "Kategorie",
  "common.status": "Status",
  "common.error": "Fehler",
  "common.warning": "Warnung",
  "common.info": "Hinweis",
  "common.noResults": "Nichts gefunden.",
  "common.needsData": "Bitte zuerst einen Gumb-Export einlesen.",
  "common.goImport": "Zum Import",
  "common.of": "von",
} as const

type Dict = Record<keyof typeof de, string>

const en: Dict = {
  "app.title": "FCWB Tools",
  "app.subtitle": "Helpers for FC Bonstetten-Wettswil",
  "app.privacy": "All data stays in this browser. Nothing is uploaded, nothing reaches a server.",
  "app.privacyShort": "Data stays local",

  "nav.home": "Overview",
  "nav.transition": "Group transition",
  "nav.roster": "Data check",
  "nav.attendance": "J+S attendance",
  "nav.settings": "Settings",

  "home.lead":
    "Three tools around the Gumb export. You export from Gumb, work here, and enter the result back into Gumb.",
  "home.transitionDesc":
    "Works out from birth years which child belongs in which group next season — and turns that into a checkable click list for Gumb.",
  "home.rosterDesc":
    "Finds duplicates, missing birth years, missing contact details and children without a group.",
  "home.attendanceDesc":
    "Checks the attendance export against the J+S rules before it goes to the national sports database.",
  "home.noApi":
    "Gumb has no public API. This app takes over the calculating and checking — you still make the changes in Gumb yourself.",
  "home.start": "Open",
  "home.dataLoaded": "{n} members loaded",
  "home.noData": "No data yet",

  "import.title": "Read Gumb export",
  "import.hint": "In Gumb: community settings → Members → Export. CSV or Excel, both work.",
  "import.attendanceHint": "In Gumb: Statistics & exports → download attendance control.",
  "import.drop": "Drop a file here or click",
  "import.dropMany": "Drop files here or click — all teams at once",
  "import.files": "Files",
  "import.fileCount": "{n} files",
  "import.headerMismatch":
    "These files have different columns from the first one: {names}. The mapping below applies to all of them — please check.",
  "import.errorDuplicateNames":
    "Two files carry the same community name. They would replace each other.",
  "import.formats": "CSV, XLSX",
  "import.reading": "Reading …",
  "import.rows": "{n} rows, {c} columns",
  "import.mapping": "Column mapping",
  "import.mappingHint": "Detected automatically. Correct it here if something is off.",
  "import.none": "— not present —",
  "import.apply": "Apply",
  "import.replaceWarning": "This replaces the currently loaded members. Worklist progress is kept.",
  "import.errorLegacy":
    "The old .xls format is not supported. Please export as CSV or XLSX from Gumb.",
  "import.errorGeneric": "Could not read the file: {msg}",
  "import.errorNoCommunity":
    "Please give the community a name — otherwise there is no way to tell which team the export is from.",
  "import.errorNoName":
    "The mapping has no name column. Without first/last name (or a name column) this cannot work.",

  "field.id": "Gumb ID",
  "field.firstName": "First name",
  "field.lastName": "Last name",
  "field.fullName": "Name (combined)",
  "field.birthDate": "Date of birth",
  "field.birthYear": "Birth year",
  "field.gender": "Gender",
  "field.email": "Email",
  "field.phone": "Phone",
  "field.groups": "Groups",
  "field.role": "Role",
  "field.ahv": "AHV number",
  "field.eventId": "Event ID",
  "field.date": "Date",
  "field.start": "Start time",
  "field.end": "End time",
  "field.status": "Attendance status",

  "trans.title": "Group transition for the new season",
  "trans.lead":
    "Every child moves up an age category for the new season. This page works out who goes where and turns it into a click list.",
  "trans.step1": "1 · Read export",
  "trans.step2": "2 · Assign groups",
  "trans.step3": "3 · Review plan",
  "trans.step4": "4 · Work through the list",
  "trans.step5": "5 · Verify",
  "trans.season": "Season",
  "trans.mapGroupsLead":
    "These group names appear in the export. Assign them to age categories — only assigned groups are part of the plan.",
  "trans.unassigned": "Unassigned",
  "trans.step1Communities": "1 · Read exports (one per team)",
  "trans.step2Communities": "2 · Assign communities",
  "trans.mapCommunitiesLead":
    "These are the communities you have read in. Assign them to age categories — only assigned communities are part of the plan.",
  "trans.communityName": "Community name",
  "trans.communityNameHint":
    "Suggested from the file name. This is what the team is called in the plan and the worklist.",
  "trans.sources": "Imported exports",
  "trans.sourcesLead":
    "Each team is its own Gumb community, so you need one export per team. Read them in one after another — they get merged.",
  "trans.sourcesEmpty": "Nothing imported yet.",
  "trans.sourceRemove": "Remove",
  "trans.sourceCount": "{n} members",
  "trans.addSource": "Add another export",
  "trans.clearSources": "Discard all exports",
  "trans.duplicateSource":
    "“{name}” has already been imported. Reading it again replaces what is currently held for that community.",
  "trans.worklistLeadCommunities":
    "Bundled by target community. In Gumb: profile → “My communities” → Matrix, find the person and add them on the row of the target community. Removing them from the old community is a second step in that community's member list.",
  "trans.matrixStep1": "Matrix: add to",
  "trans.matrixStep2": "Then remove from",
  "trans.verifyLeadCommunities":
    "Once you are done in Gumb: download all team exports again and read them in here. You will see immediately whether every child arrived — and left the old community.",
  "trans.groupCount": "{n} people",
  "trans.planSummary": "{move} moves, {stay} stay, {graduate} age out, {review} to review",
  "trans.action.move": "Moves",
  "trans.action.stay": "Stays",
  "trans.action.graduate": "Ages out",
  "trans.action.review": "Review",
  "trans.from": "from",
  "trans.to": "to",
  "trans.worklist": "Worklist for Gumb",
  "trans.worklistLead":
    "Bundled by target group. In Gumb: community settings → Members → the “Groups” column. Finish one target group, then the next.",
  "trans.worklistEmpty": "No moves needed.",
  "trans.done": "{done} of {total} done",
  "trans.resetProgress": "Reset progress",
  "trans.remove": "remove from",
  "trans.add": "add to",
  "trans.override": "Target group",
  "trans.overrideStay": "Keep where it is",
  "trans.overrideSkip": "Do not process",
  "trans.overrideAuto": "Automatic",
  "trans.resetOverrides": "Reset manual corrections",
  "trans.unmanaged":
    "{n} people are in no assigned group (coaches, board, parents) and are left untouched.",
  "trans.verifyLead":
    "Once you are done in Gumb: export again there and read the new file in here. You will see immediately whether everything landed.",
  "trans.verifyUpload": "Read verification export",
  "trans.verifyOk": "{n} moves applied correctly",
  "trans.verifyMissing": "{n} moves still missing",
  "trans.verifyNotFound": "{n} people not found in the new export",
  "trans.verifyAdded": "{n} people are newly added",
  "trans.verifyPerfect": "All applied. The season transition is done.",
  "trans.verifyIncomplete":
    "The verification is still missing exports for these communities: {names}. Until they are in, a child that arrived looks like a child that got lost.",
  "trans.actualGroups": "Currently",

  "reason.noBirthYear": "No birth year in the export",
  "reason.multipleCategories": "In several age categories at once",
  "reason.tooOld": "Too old for the junior structure",
  "reason.multipleTargetGroups": "Target category has several groups — please choose",
  "reason.manualStay": "Manually set to “stays”",

  "export.xlsx": "Excel (.xlsx)",
  "export.csv": "CSV",
  "export.note":
    "Gumb cannot import members — these files are working documents to work through and hand around, not an import template.",
  "export.sheetPlan": "Plan",
  "export.sheetWorklist": "Worklist",
  "export.colLastName": "Last name",
  "export.colFirstName": "First name",
  "export.colBirthYear": "Birth year",
  "export.colStatus": "Status",
  "export.colFrom": "From",
  "export.colTo": "To",
  "export.colNotes": "Notes",
  "export.colDone": "Done",
  "export.colDirection": "Direction",
  "export.colCounterpart": "Counterpart",
  "export.arrival": "Joining",
  "export.departure": "Leaving",

  "roster.title": "Data check",
  "roster.lead":
    "The problems that trip up the season transition and the J+S report — before they do.",
  "roster.clean": "No problems found.",
  "roster.affected": "{n} affected",
  "roster.showAll": "Show all",
  "roster.showLess": "Show less",

  "rule.duplicateName": "Duplicate entry (same name, same birth year)",
  "rule.sameNameDifferentYear": "Same name, different birth year (probably siblings)",
  "rule.sharedEmail": "Several members share one email address",
  "rule.missingBirthYear": "Birth year missing — group transition cannot be computed",
  "rule.missingBirthDate": "Birth year only, no full date — J+S requires the date",
  "rule.noGroup": "In no group",
  "rule.noContact": "Neither email nor phone on file",
  "rule.invalidEmail": "Email address looks invalid",
  "rule.invalidAhv": "AHV number is not in the format 756.xxxx.xxxx.xx",
  "rule.implausibleBirthYear": "Implausible birth year",
  "rule.multipleCategories": "In several age categories at once",
  "rule.categoryMismatch": "Group does not match the birth year for the selected season",

  "jus.title": "J+S attendance control",
  "jus.lead":
    "Checks the Gumb export before it goes to the national sports database. Finds what would cause rejections or non-claimable activities there.",
  "jus.activities": "Activities",
  "jus.participants": "Participants",
  "jus.presentTotal": "Attendances",
  "jus.clean": "Nothing to report.",
  "jus.settings": "Check rules",
  "jus.minParticipants": "Minimum participants per activity",
  "jus.ageRange": "Permitted age",
  "jus.requireAhv": "Treat AHV number as required",
  "jus.perParticipant": "Per participant",
  "jus.presentCount": "Present",
  "jus.listedCount": "Listed",
  "jus.rate": "Rate",
  "jus.tooFewParticipants":
    "Activity with fewer than the minimum number of participants present — not claimable",
  "jus.missingDate": "Activity without a date",
  "jus.missingTimes": "Activity without usable start/end times",
  "jus.missingAhv": "AHV number missing",
  "jus.missingBirthDate": "Date of birth missing",
  "jus.outsideAgeRange": "Outside the J+S age range at the time of the activity",
  "jus.multiplePerDay":
    "Present more than once on the same day — J+S only reimburses the longer activity",
  "jus.disclaimer":
    "The thresholds are configurable here. The current BASPO directives are what actually binds you.",

  "settings.title": "Settings",
  "settings.categories": "Age categories",
  "settings.categoriesLead":
    "Age = season start year − birth year. For season {season} that gives the birth years shown.",
  "settings.disclaimer":
    "Defaults follow SFV/FVRZ. Check against the current implementing provisions before each season change.",
  "settings.categoryName": "Category",
  "settings.ageFrom": "Age from",
  "settings.ageTo": "to",
  "settings.years": "Birth years",
  "settings.groups": "Gumb groups (comma separated)",
  "settings.communities": "Gumb communities (comma separated)",
  "settings.structure": "How Gumb is set up",
  "settings.structureLead":
    "This decides where a child's current category comes from and how the move is made in Gumb.",
  "settings.structureCommunities": "One community per team",
  "settings.structureCommunitiesHint":
    "This is how FCWB runs it. One export per team; moves go through the member matrix.",
  "settings.structureGroups": "One community, teams are groups",
  "settings.structureGroupsHint":
    "A single export with a groups column; moves go through the dropdown in the members tab.",
  "settings.structureWarning":
    "Switching discards the imported members — the two models read the same file differently.",
  "settings.femaleExtra": "Girls may be one year older",
  "settings.addCategory": "Add category",
  "settings.resetCategories": "Reset to defaults",
  "settings.backup": "Backup",
  "settings.backupLead":
    "Because nothing lives on a server, backups are your responsibility. The file contains personal data — treat it accordingly.",
  "settings.download": "Download backup",
  "settings.restore": "Restore backup",
  "settings.danger": "Delete all data",
  "settings.dangerLead":
    "Deletes members, attendance and progress from this browser. Cannot be undone.",
  "settings.dangerConfirm": "Really delete all local data?",
  "settings.language": "Language",
  "settings.restored": "Backup restored.",
  "settings.restoreFailed": "That file is not a valid backup.",

  "common.members": "Members",
  "common.search": "Search",
  "common.print": "Print / PDF",
  "common.close": "Close",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.name": "Name",
  "common.year": "Birth year",
  "common.group": "Group",
  "common.category": "Category",
  "common.status": "Status",
  "common.error": "Error",
  "common.warning": "Warning",
  "common.info": "Note",
  "common.noResults": "Nothing found.",
  "common.needsData": "Please read a Gumb export first.",
  "common.goImport": "Go to import",
  "common.of": "of",
}

export type TranslationKey = keyof typeof de

const DICTS: Record<Locale, Dict> = { de, en }

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const raw = DICTS[locale][key] ?? DICTS.de[key] ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
]
