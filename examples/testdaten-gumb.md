# Testdaten für die Gumb-Testumgebung

Aufbau: **eine Gemeinschaft pro Team** — so wie es der FCWB macht. Der
Jahreswechsel verschiebt Kinder also zwischen Gemeinschaften, nicht zwischen
Gruppen innerhalb einer Gemeinschaft.

Diese 12 Personen in 5 Gemeinschaften erfassen. Sie sind so gewählt, dass jeder
Sonderfall genau einmal vorkommt und sich das erwartete Ergebnis ohne
Nachrechnen prüfen lässt.

## Die Regel dahinter

Die Zuteilung unten entspricht der **Saison 2025/26**. Getestet wird der Wechsel
in die **Saison 2026/27** (die Voreinstellung der App). Daraus folgt ein Muster,
an dem man das Ergebnis sofort erkennt:

> **Ungerade Jahrgänge rücken auf, gerade Jahrgänge bleiben.**

2017 rückt auf, 2018 bleibt, 2015 rückt auf, 2016 bleibt. Wer dieses Muster in
der Arbeitsliste durchbrochen sieht, hat einen Fehler gefunden.

## Die fünf Gemeinschaften

`Junioren F` · `Junioren E` · `Junioren D` · `Junioren C` · `Junioren A`

Junioren C und A sind nötig, obwohl dort kaum jemand steht: sie sind die Ziele
für die Aufrückenden. Ohne sie gäbe es in Gumb nichts, wohin man verschieben
könnte. (Ein Abo deckt beliebig viele Gemeinschaften ab, das kostet nichts
extra.)

## Die Personen

E-Mail-Adressen mit Plus-Adressierung, damit alle Einladungen im selben Postfach
landen: `deine.adresse+t01@gmail.com` und so weiter.

### Gemeinschaft «Junioren F»

| Vorname | Nachname | Geburtsdatum | Geschlecht | Erwartet |
|---|---|---|---|---|
| Luca | Meier | 14.03.2017 | m | **wechselt** → Junioren E |
| Nina | Huber | 02.11.2018 | w | bleibt |
| Marco | Trainer | 01.01.1985 | m | **unberührt** — Betreuungsperson im Team |

### Gemeinschaft «Junioren E»

| Vorname | Nachname | Geburtsdatum | Geschlecht | Erwartet |
|---|---|---|---|---|
| Timo | Frei | 30.07.2016 | m | bleibt |
| Jan | Widmer | 21.01.2015 | m | **wechselt** → Junioren D |

### Gemeinschaft «Junioren D»

| Vorname | Nachname | Geburtsdatum | Geschlecht | Erwartet |
|---|---|---|---|---|
| Sara | Keller | 17.09.2013 | w | **wechselt** → Junioren C |
| Robin | Graf | 12.05.2014 | m | bleibt |
| Fabio | Steiner | *leer lassen* | m | **prüfen** — kein Jahrgang |
| Tim | Hofer | 30.06.2013 | m | **prüfen** — steht auch in Junioren C |

### Gemeinschaft «Junioren C»

| Vorname | Nachname | Geburtsdatum | Geschlecht | Erwartet |
|---|---|---|---|---|
| Jonas | Ammann | 14.10.2012 | m | bleibt |
| Tim | Hofer | 30.06.2013 | m | *dieselbe Person wie oben — bewusst in zwei Gemeinschaften* |

### Gemeinschaft «Junioren A»

| Vorname | Nachname | Geburtsdatum | Geschlecht | Erwartet |
|---|---|---|---|---|
| Noah | Baumann | 11.06.2007 | m | **fällt oben raus** (wird 19) |
| Mia | Kaiser | 30.04.2007 | **w** | bleibt — Juniorinnen dürfen ein Jahr älter sein |

## Erwartetes Gesamtergebnis

| | Anzahl | Wer |
|---|---|---|
| Wechselt | **3** | Luca Meier, Jan Widmer, Sara Keller |
| Bleibt | **5** | Nina Huber, Timo Frei, Robin Graf, Jonas Ammann, Mia Kaiser |
| Fällt oben raus | **1** | Noah Baumann |
| Prüfen | **2** | Fabio Steiner, Tim Hofer |
| Unberührt | **1** | Marco Trainer |

## Drei Fälle, die absichtlich wackeln

**Marco Trainer** ist der wichtigste Test dieses Aufbaus. Weil jedes Team eine
eigene Gemeinschaft ist, steht der Trainer mit in der Kinderliste. Er darf
**nicht** als „fällt oben raus" im Plan erscheinen. Die App erkennt ihn an
Jahrgang und Rolle. Falls er trotzdem auftaucht, gibt Gumb entweder die Rolle
nicht mit aus oder das Geburtsdatum fehlt — beides ist ein Befund, kein Zufall.

**Mia Kaiser** ist der Lackmustest für die Geschlechtsspalte. Steht das
Geschlecht nicht im Export, kann die App die Juniorinnen-Regel nicht anwenden und
setzt Mia auf *fällt oben raus* statt auf *bleibt*. Das wäre dann der Befund,
dass diese Regel jedes Jahr von Hand gesetzt werden muss.

**Fabio Steiner** prüft, ob Gumb ein Mitglied ohne Geburtsdatum überhaupt
zulässt. Falls nicht, kann der Fall in der Realität nicht auftreten und die
Prüfung ist reine Vorsichtsmassnahme.

## Ablauf

1. Aus **jeder** der fünf Gemeinschaften exportieren:
   Gemeinschaftseinstellungen → Mitglieder → Export.
2. Die Dateien nach der Gemeinschaft benennen (`Junioren F.csv` und so weiter) —
   die App leitet den Teamnamen aus dem Dateinamen ab.
3. Alle fünf Dateien auf einmal in `/transition` einwerfen. Namen prüfen,
   Spaltenzuordnung prüfen, übernehmen.
4. Gemeinschaften den Alterskategorien zuordnen.
5. Plan mit der Tabelle oben vergleichen.
6. Arbeitsliste in Gumb abarbeiten: Profil → «Meine Gemeinschaften» → Matrix,
   Person suchen, in der Zielgemeinschaft hinzufügen. Danach in der alten
   Gemeinschaft aus der Mitgliederliste entfernen.
7. Alle fünf Gemeinschaften erneut exportieren und unter Schritt 5 einlesen.
   Die Kontrolle muss „Alles übernommen" melden.

## Was dabei zu notieren ist

- Die **Kopfzeile** des Exports, wörtlich.
- Ob **Geburtsdatum** ein Standardfeld ist oder erst angelegt werden muss.
- Ob **Geschlecht** und **Rolle** im Export stehen.
- Ob **eingeladene, aber noch nicht bestätigte** Mitglieder im Export erscheinen.
- Ob die Matrix wirklich nur **hinzufügt** und das Entfernen ein zweiter Schritt
  in der alten Gemeinschaft ist.
