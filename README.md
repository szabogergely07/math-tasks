# Mathe-Abenteuer

Ein deutsches Mathe-Webspiel für Kinder mit:

- Addition und Subtraktion von 0 bis 100
- Multiplikation von 0 bis 10
- Extra-Option: nur Einmaleins mit 2, 3, 4, 5 und 10
- mehreren Fragetypen
- Punkten, Sternen und Abschlussnote wie in Österreich
- zentral gespeichertem Verlauf über eine Vercel API

## Was wurde für den zentralen Verlauf eingebaut?

- Frontend lädt Ergebnisse von `GET /api/results`
- Frontend speichert Ergebnisse über `POST /api/results`
- Verlauf löschen läuft über `DELETE /api/results`
- Passwort fürs Löschen: `schule`
- Wenn die API nicht erreichbar ist, nutzt die App lokal einen Fallback im Browser

## Dateien

- `index.html` – Struktur der App
- `styles.css` – Design und Layout
- `script.js` – Spiellogik und API-Anbindung
- `config.js` – optionale API-Basis-URL
- `api/results.js` – Vercel API für zentralen Verlauf
- `package.json` – Abhängigkeit für Vercel Blob

## Vercel einrichten

1. Repository bei Vercel importieren
2. In Vercel **Blob** Storage für das Projekt aktivieren
3. Environment Variable setzen:
   - `HISTORY_PASSWORD=schule`
4. Deploy ausführen

Danach läuft alles auf derselben Vercel-App:

- Webseite
- API unter `/api/results`

## `config.js`

Standardmäßig ist enthalten:

```js
window.APP_CONFIG = {
  apiBaseUrl: '',
};
```

Wenn Frontend und API zusammen auf Vercel laufen, muss nichts geändert werden.

Wenn das Frontend woanders liegt, kann hier die Basis-URL gesetzt werden, zum Beispiel:

```js
window.APP_CONFIG = {
  apiBaseUrl: 'https://dein-projekt.vercel.app/api',
};
```

## GitHub Pages

GitHub Pages funktioniert weiter für das Frontend, aber der zentrale Verlauf funktioniert nur, wenn die Vercel API deployed ist.

## Lokal öffnen

Einfach `index.html` im Browser öffnen.
