# Mathe-Abenteuer

Ein deutsches Mathe-Webspiel für Kinder mit:

- Addition und Subtraktion von 0 bis 100
- Multiplikation von 0 bis 10
- Extra-Option: nur Einmaleins mit 2, 3, 4, 5 und 10
- Schnellrechner - Malrechnen mit 20 Aufgaben in 45 Sekunden (Faktoren nur 2 bis 9)
- mehreren Fragetypen
- Punkten, Sternen und Abschlussnote wie in Österreich
- zentral gespeichertem Verlauf über Google Apps Script

## Aktuelle Speicherung

Die App verwendet dein Google Apps Script als zentrale Speicherung.

Verwendete URL:

`https://script.google.com/macros/s/AKfycbwe7EfDb5hjQDzgPmZ-Tj_lLHp2xBBv0y9UpfL5Cw-fRdrkmcJ2G66ynULFlyfnmmQGtw/exec`

## Wichtig für das Apps Script

Die App nutzt:

- `GET` zum Laden des Verlaufs
- `POST` zum Speichern eines Ergebnisses
- `POST` mit `{ "action": "clear", "password": "schule" }` zum Löschen

## Neuer Spielmodus

**Schnellrechner - Malrechnen**

- 20 Malaufgaben
- 45 Sekunden Zeit
- Note 1 im Schnellrechner gibt es nur bei höchstens 1 Fehler
- nach Ablauf der Zeit wird sofort ausgewertet
- im Schnellrechner werden Faktoren nur von `2` bis `9` verwendet (ohne `1` und `10`)

## Duplikate im Verlauf

Der Doppelspeicher-Bug wurde im Frontend abgesichert.

Zusätzlich kannst du einmalig im Apps Script diese Funktion ausführen, um bereits vorhandene Duplikate zu entfernen:

```javascript
function dedupeStoredResults() {
  const STORAGE_KEY = 'math_results_v1';
  const raw = PropertiesService.getScriptProperties().getProperty(STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : [];
  const seen = new Set();
  const deduped = parsed.filter((entry) => {
    const key = entry.id || `${entry.name}|${entry.modeLabel}|${entry.score}|${entry.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  PropertiesService.getScriptProperties().setProperty(STORAGE_KEY, JSON.stringify(deduped));
}
```

## Dateien

- `index.html` – Struktur der App
- `styles.css` – Design und Layout
- `script.js` – Spiellogik und Google-Apps-Script-Anbindung

## GitHub Pages

GitHub Pages kann weiter für das Frontend verwendet werden.
