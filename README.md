# TimbrApp UI

Frontend Angular 21 application for TimbrApp — CFDI 4.0 invoice extraction.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Angular CLI 21 (optional, can use `npx`)

## Install

```bash
npm install
```

## Development server

```bash
npm start
```

Opens at `http://localhost:4200`. The app will reload automatically on file changes.

The dev server proxies nothing by default. The API URL defaults to `http://localhost:5000`.
Make sure the backend is running on that port.

## Build

```bash
npm run build
```

Production artifacts land in `dist/timbrapp-ui/browser/`.

## Environment configuration

| File | Used when |
|---|---|
| `src/environments/environment.ts` | `ng serve` / development build |
| `src/environments/environment.prod.ts` | `ng build --configuration production` |

For Vercel deploys, set the backend URL by editing `src/environments/environment.prod.ts`
or by injecting it at runtime via a server-side environment variable and a
`src/environments/environment.prod.ts` that reads `window.__env.apiBaseUrl`.

## Vercel deployment

1. Push this directory to a GitHub repo (or the `frontend/timbrapp-ui` subdirectory).
2. Import the project in Vercel.
3. Set **Root Directory** to `frontend/timbrapp-ui` if deploying from the monorepo root.
4. Vercel will use `npm run build` and serve from `dist/timbrapp-ui/browser/`.
5. The `vercel.json` at the project root handles SPA rewrites.

## Tech stack

- Angular 21.2 (standalone components, signals, new control flow)
- Tailwind CSS 3 + PostCSS
- TypeScript strict mode
