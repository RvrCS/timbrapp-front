# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps
npm start            # dev server at http://localhost:4200 (opens browser)
npm run build        # production build → dist/timbrapp-ui/browser/
npm run build:qa     # QA build (environment.qa.ts)
npm run build:prod   # explicit production build
npm test             # run unit tests (Karma)
```

No linting script is configured. TypeScript strict mode catches most issues at build time.

## Architecture

Angular 21 SPA using standalone components throughout — no NgModules.

**Entry point:** `src/app/app.config.ts` — wires providers (router, HttpClient + interceptors, LucideAngularModule icon tree-shaking).

**Routing (`app.routes.ts`):**
- `/login` — public, no shell
- All authenticated routes load inside `ShellComponent` as a layout parent with a collapsible sidebar
- Default authenticated route is `/subir`

**HTTP layer:**
- `ApiService` — thin wrapper over `HttpClient`, builds URLs from `environment.apiBaseUrl`
- `authInterceptor` — functional interceptor, attaches `Authorization: Bearer <token>` to every request except those matching `/api/auth/`
- `AuthService` — holds JWT + user snapshot in `signal`s, persists to `localStorage` under keys `timbrapp_token` / `timbrapp_user`

**Error handling:** `src/app/utils/http-error.utils.ts` — `parseHttpError` / `formatHttpError` normalize Angular `HttpErrorResponse` into a `ParsedError` with a main message + field-level details. Handles ASP.NET ModelState 400s specifically. Use these in all component error handlers.

**Environments:**

| File | Used for |
|---|---|
| `src/environments/environment.ts` | `ng serve` / dev — `https://localhost:52270` |
| `src/environments/environment.qa.ts` | QA builds |
| `src/environments/environment.prod.ts` | Production — `https://api.timbrapp.rinarasoft.com` |

**Styling:** Tailwind CSS 3 + PostCSS. No component CSS files — all styling is utility-class inline in templates.

**Icons:** `lucide-angular` — only icons registered in `app.config.ts` `LucideAngularModule.pick({...})` are available app-wide. Add new icons there before using them in templates.

**Vercel:** `vercel.json` at root rewrites all routes to `/index.html` (SPA fallback) and sets `outputDirectory` to `dist/timbrapp-ui/browser/`.

## Domain

TimbrApp is a CFDI 4.0 (Mexican electronic invoice) stamping app. Backend is ASP.NET. Spanish is used throughout UI text and route/variable names.
