# Base44 Dev Environment — Signalencheck Mensenhandel

## What this is
A static Progressive Web App (PWA) for practicing human-trafficking signal recognition.
Pure HTML/CSS/JS — **no build step, no backend, no runtime dependencies, no external services**.

## Running it
```sh
docker compose -f docker-compose.base44.yml up -d
```
Serves the bind-mounted source via nginx on host port 3000. Edits to files are
reflected on browser refresh (call `reload_preview` for the iframe).

## Why nginx runs as root
The sandbox repo root has `drwx------` permissions. nginx's default non-root worker
cannot traverse it, so `nginx.dev.conf` sets `user root;`. This is dev-only.

## Healthcheck
Uses `wget` against `127.0.0.1:80` (not `localhost`, which resolves to IPv6 `::1`
where nginx does not listen). Checks that `index.html` contains "Signalencheck".

## Tests (optional, require Node 18+)
```sh
node tests/core.test.js
node tests/ui.test.js
node tests/pwa.test.js
```
These are CommonJS tests of `model.js`/`signals.js` logic — not needed to run the app.

## Secrets
None required. The app stores everything in page memory; there is no server, DB,
or external API.
