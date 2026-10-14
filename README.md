# Software test og sikkerhed

Interaktivt pensum på [testing.mercantec.tech](https://testing.mercantec.tech) — H3/H4 målpinde inden for softwaretest og websikkerhed.

## Stack

- Vite + React + TypeScript
- Statisk build via nginx i Docker
- Deploy: Docker Compose på Dokploy

## Lokal udvikling

```bash
cd web
npm install
npm run dev
```

Eller med Docker (port 3000):

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

## Struktur

| Sti | Indhold |
|-----|---------|
| `web/src/pages/` | Pensum-lektioner (React) |
| `web/src/data/objectives.ts` | 15 målpinde med Site/Notion/Repo |
| `web/src/components/` | Layout, Callout, CodeBlock, Mermaid m.m. |
| `docker-compose.yml` | Produktion (Traefik → `testing.mercantec.tech`) |

## Ruter

- `/` — forside
- `/maalpinde` — hub over alle 15 målpinde
- `/test/*` — test-pensum (unit, integration, Bruno, CI/CD, tryk, UX …)
- `/sikkerhed/*` — sikkerhed (TLS, auth, hashing, angreb, tools …)

## Hosting

Compose-servicen `web` eksponeres via Traefik på `Host(\`testing.mercantec.tech\`)` og er tilsluttet `dokploy-network`. Ingen API/database i v1.
