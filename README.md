# FCWB Werkzeuge

Helferlein für den FC Bonstetten-Wettswil rund um den **Gumb**-Export.
**Alle Personendaten bleiben im Browser** — es gibt keinen Server-Speicher, keine
API-Routes, keine Server Actions und keine Telemetrie.

## Warum es diese App gibt

Gumb hat **keine öffentliche Schnittstelle**. Recherchestand September 2026:

| | Gumb |
|---|---|
| Öffentliche REST-API / Developer-Portal | ❌ nicht vorhanden |
| Mitglieder **exportieren** (CSV) | ✅ Gemeinschaftseinstellungen → Mitglieder |
| Mitglieder **importieren** | ❌ existiert nicht — nur einzeln per Einladung |
| CSV-/Excel-Import | ✅ aber nur für Termine und Anwesenheitsstatistiken |
| Gruppe wechseln | manuell, Dropdown pro Person |
| Mitglieder-Matrix | verschiebt zwischen *Gemeinschaften*, nicht zwischen Gruppen |
| Individuelle Integration | 🟡 auf Anfrage, siehe Gumb-Roadmap |

Der oft angenommene Weg „Excel exportieren → umbauen → wieder importieren" **schliesst
also nicht** — es gibt keinen Mitglieder-Import, in den man zurückschreiben könnte.

Diese App automatisiert deshalb das **Rechnen und Prüfen**, nicht das Schreiben:
Sie sagt exakt, wer wohin muss, und kontrolliert danach, ob es angekommen ist.
Die Dropdown-Klicks in Gumb macht weiterhin ein Mensch.

> Es lohnt sich trotzdem, `support@gumb.app` nach API-Zugang für den jährlichen
> Alterskategorienwechsel zu fragen. Die Roadmap lädt ausdrücklich dazu ein.

## Die drei Werkzeuge

### 1 · Gruppenwechsel (`/transition`)

Der jährliche Saisonwechsel in fünf Schritten:

1. Gumb-Mitgliederexporte einlesen (CSV oder XLSX, Spalten werden automatisch erkannt)
2. Gemeinschaften bzw. Gruppen den Alterskategorien zuordnen
3. Plan prüfen — wer wechselt, wer bleibt, wer fällt oben raus, was ist unklar
4. **Arbeitsliste abarbeiten** — nach Ziel gebündelt und abhakbar, damit man in
   Gumb zielgerichtet klickt statt pro Kind zu suchen
5. Kontrolle — nach der Handarbeit erneut exportieren, einlesen, und die App sagt
   „alles übernommen" oder nennt genau die fehlenden Fälle

Der Fortschritt der Arbeitsliste überlebt einen Seitenwechsel oder Reload.

Die Arbeitsliste lässt sich als **Excel-Mappe** oder CSV herunterladen. Die Mappe
enthält ein Blatt „Plan" (alles), ein Blatt „Arbeitsliste" (nur die Wechsel, nach
Ziel gebündelt, mit Erledigt-Spalte) und **ein Blatt pro Team** mit dessen
Zu- und Abgängen — damit man jeder Trainerin genau ihr Blatt schicken kann.

> Diese Dateien sind **keine Import-Vorlage**. Gumb kann keine Mitglieder
> importieren; es gibt nichts, wohin man sie zurückschreiben könnte. Sie sind
> Arbeitsunterlage, Verteilhilfe und Beleg.

#### Zwei Aufbauten, ein Werkzeug

Vereine führen Gumb unterschiedlich, und davon hängt ab, was der Jahreswechsel
überhaupt für eine Operation ist. Beides wird unterstützt, umschaltbar unter
`/settings`:

| | Eine Gemeinschaft pro Team *(FCWB)* | Eine Gemeinschaft, Teams sind Gruppen |
|---|---|---|
| Export | einer pro Team | ein einziger |
| Aktuelle Kategorie kommt aus | der Datei, aus der jemand stammt | der Gruppen-Spalte |
| Verschoben wird über | Mitglieder-Matrix, plus Entfernen in der alten Gemeinschaft | Dropdown im Mitglieder-Tab |

Beim Gemeinschafts-Modell lassen sich alle Team-Exporte auf einmal einwerfen; die
App leitet den Teamnamen aus dem Dateinamen ab und führt sie zusammen. Wer in
zwei Gemeinschaften steht, landet bewusst in „prüfen" statt in einem stillen
Wechsel. **Betreuungspersonen bleiben unberührt** — sie stehen bei diesem Aufbau
mit in der Team-Gemeinschaft und würden sonst als „fällt oben raus" im Plan
erscheinen; erkannt werden sie an Rolle und Jahrgang.

### 2 · Datencheck (`/roster`)

Findet die Probleme, die den Saisonwechsel und die J+S-Abrechnung sabotieren:
echte Duplikate, gleiche Namen mit anderem Jahrgang (Geschwister), geteilte
E-Mail-Adressen, fehlende Jahrgänge oder Geburtsdaten, Kinder ohne Gruppe,
fehlende Kontaktangaben, ungültige E-Mail- oder AHV-Formate, Kinder in mehreren
Alterskategorien und Gruppen, die nicht zum Jahrgang passen.

### 3 · J+S-Anwesenheitskontrolle (`/attendance`)

Prüft den Export „Anwesenheitskontrolle" **bevor** er in die Nationale Datenbank
Sport (NDS) geht: Aktivitäten unter der Mindestteilnehmerzahl, fehlende Daten oder
Zeiten, fehlende AHV-Nummern und Geburtsdaten, Teilnehmende ausserhalb der
Altersspanne zum Zeitpunkt der Aktivität, und Mehrfachanwesenheit am selben Tag
(J+S vergütet nur die längere Aktivität). Dazu eine Anwesenheitsquote pro Person.

Die Schwellenwerte sind in der Oberfläche einstellbar. **Verbindlich sind die
aktuellen Weisungen des BASPO**, nicht diese App.

## Alterskategorien

Voreingestellt nach SFV/FVRZ. Die Regel lautet: `Alter = Saisonstartjahr − Jahrgang`.

| Kategorie | Alter | Jahrgänge Saison 2026/27 |
|---|---|---|
| Junioren G | ≤ 6 | 2020 und jünger |
| Junioren F | 7–8 | 2019, 2018 |
| Junioren E | 9–10 | 2017, 2016 |
| Junioren D | 11–12 | 2015, 2014 |
| Junioren C | 13–14 | 2013, 2012 |
| Junioren B | 15–16 | 2011, 2010 |
| Junioren A | 17–18 | 2009, 2008 |

In D, C, B und A dürfen Juniorinnen ein Jahr älter sein — dafür braucht es eine
Geschlechtsspalte im Export, sonst entscheidet der Jahrgang allein.

**Diese Tabelle ist ein Startwert, keine Rechtsquelle.** Sie ist unter
`/settings` frei editierbar (inklusive vereinseigener Gruppennamen wie „Ea"/„Eb")
und sollte vor jedem Saisonwechsel mit den aktuellen Ausführungsbestimmungen
abgeglichen werden.

## Datenschutz

Die App verarbeitet Personendaten von Kindern. Deshalb:

- Kein Server-Speicher, keine API-Routes, keine Server Actions — alles läuft im Browser.
- Persistenz ausschliesslich in `localStorage` dieses einen Browsers.
- Eine Content-Security-Policy mit `connect-src 'self'` unterbindet ausgehende
  Netzwerkverbindungen; `form-action 'none'` verhindert das Absenden von Formularen.
- Kein Tracking, keine externen Schriften, keine CDN-Aufrufe.
- **Sicherung ist deine Verantwortung**: `/settings` → Sicherung herunterladen.
  Die JSON-Datei enthält Klartext-Personendaten — entsprechend behandeln.
- Auf einem geteilten Gerät nach getaner Arbeit `/settings` → „Alle Daten löschen".

## Entwicklung

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # Prüfungen der Fachlogik (ohne Browser)
pnpm typecheck
pnpm build
```

`pnpm test` deckt Alterskategorien, Spaltenerkennung, Datumsformate, die
Wechsel-Berechnung inklusive Sonderfälle, die Kontrolle danach, den Datencheck
und die J+S-Prüfungen ab.

### Aufbau

```
src/lib/domain/    Fachlogik, frei von React — hier wird gerechnet
  categories.ts    Alterskategorien und Saisonlogik
  transition.ts    Wechselplan, Arbeitsliste, Kontrolle
  roster.ts        Datenqualitätsprüfungen
  jus.ts           J+S-Prüfungen
src/lib/io/        Dateien einlesen und Spalten zuordnen
src/lib/store.tsx  Zustand + localStorage
src/components/    Oberfläche
src/app/           Seiten (alle statisch, alles clientseitig)
```

### Deployment

Vercel erkennt Next.js automatisch — Repository verbinden, fertig. Es braucht
keine Umgebungsvariablen und keine Datenbank; alle Seiten sind statisch
vorgerendert.

#### Zugang per geteiltem Link

Setze in Vercel unter Settings → Environment Variables die Variable
`ACCESS_KEY`. Danach kommt nur noch rein, wer den Link mit dem Schlüssel hat;
alle anderen sehen eine Hinweisseite.

```bash
# Schlüssel erzeugen
node -e "console.log(require('crypto').randomBytes(16).toString('base64url'))"
```

Der zu teilende Link lautet dann `https://<domain>/?key=<ACCESS_KEY>`. Beim
ersten Aufruf wird ein Cookie gesetzt (ein Jahr gültig, `HttpOnly`) und der
Schlüssel aus der Adresszeile entfernt, damit er nicht im Verlauf, in
Lesezeichen oder in Screenshots landet. Wer den Zugang entziehen will, ändert
`ACCESS_KEY` und verteilt den neuen Link — alte Cookies verfallen damit sofort.

**Ist die Variable nicht gesetzt, ist die Seite öffentlich** und zeigt oben
einen Warnbanner. Eine Schranke, von der man fälschlich annimmt, sie sei aktiv,
wäre schlimmer als gar keine.

Was diese Schranke leistet und was nicht:

- ✅ Hält zufällige Besucher und Suchmaschinen draussen.
- ❌ Ist **kein** Schutz personenbezogener Daten. Links wandern weiter — per
  Mail, im Browserverlauf, auf geteilten Geräten. Es gibt kein Konto, keine
  Rollen, keine Nachvollziehbarkeit, wer den Link benutzt hat.

Der eigentliche Datenschutz liegt woanders und ist stärker: **auf dem Server
liegen überhaupt keine Mitgliederdaten.** Wer den Link errät, findet ein leeres
Werkzeug vor. Wer echten Zugriffsschutz mit Konten braucht, nimmt den
Passwortschutz von Vercel (Pro) oder SSO davor.

## Ausprobieren

`examples/beispiel-mitglieder.csv` enthält erfundene Testdaten in der Spaltenform
eines Gumb-Exports — damit lässt sich der ganze Ablauf durchspielen, ohne echte
Kinderdaten anzufassen.

`examples/testdaten-gumb.md` beschreibt, wie sich in einer eigenen
Gumb-Testumgebung (60 Tage kostenlos, ohne Zahlungsdaten) fünf Gemeinschaften
mit zwölf erfundenen Personen aufbauen lassen, sodass jeder Sonderfall genau
einmal vorkommt und das erwartete Ergebnis ohne Nachrechnen prüfbar ist.
