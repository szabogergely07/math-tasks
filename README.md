# Mathe-Abenteuer

Ein deutsches Mathe-Webspiel für Kinder mit:

- Addition und Subtraktion von 0 bis 100
- Multiplikation von 0 bis 10
- Extra-Option: nur Einmaleins mit 2, 3, 4, 5 und 10
- mehreren Fragetypen
- Punkten, Sternen und Abschlussnote wie in Österreich
- zentral gespeichertem Verlauf über Google Apps Script

## Aktuelle Speicherung

Die App verwendet jetzt dein Google Apps Script als zentrale Speicherung.

Verwendete URL:

`https://script.google.com/macros/s/AKfycbzaHikADIWL3pnDJzocgBlC7T-nk57N9p0MaOMbr7djoXhUu3jN06KLd9mAno1qGprsfA/exec`

## Wichtig für das Apps Script

Die App nutzt:

- `GET` zum Laden des Verlaufs
- `POST` zum Speichern eines Ergebnisses
- `POST` mit `{ "action": "clear", "password": "schule" }` zum Löschen

Das bedeutet:

Dein Apps Script muss beim `doPost` nicht nur neue Ergebnisse speichern, sondern auch den Fall behandeln, dass `action === "clear"` gesendet wird.

## Dateien

- `index.html` – Struktur der App
- `styles.css` – Design und Layout
- `script.js` – Spiellogik und Google-Apps-Script-Anbindung

## GitHub Pages

GitHub Pages kann weiter für das Frontend verwendet werden.

## Lokal öffnen

Einfach `index.html` im Browser öffnen.
