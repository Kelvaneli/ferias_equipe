# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Gestor de Férias da Equipe" — a team vacation planner (shared calendar, table, chart, per-user profiles). React 19 + Vite + Tailwind v4 SPA backed by Firebase (Google Auth + Firestore). The skeleton was generated in Firebase Studio and development now continues locally here; leftovers from that environment (`metadata.json`, the `GEMINI_API_KEY`/`APP_URL` placeholders in `.env.example`, the `DISABLE_HMR` logic, the unused `@google/genai` dependency) aren't needed for local work. All UI text is in Brazilian Portuguese; keep new strings in pt-BR and dates displayed as DD/MM/YYYY (`formatDateBR`).

## Commands

Package manager is Bun (`bun.lock`), though npm scripts work too.

- `bun run dev` — Vite dev server on port 3000 (host 0.0.0.0)
- `bun run build` — production build into `dist/`
- `bun run start` — `server.ts` (Express) serves `dist/` with SPA fallback plus `/healthz` and `/api/health`; a Cloud Run leftover, not used in production
- `bun run lint` — type check only (`tsc --noEmit`); there is no ESLint and no test suite

`DISABLE_HMR=true` disables HMR and file watching. The hosted Studio environment set this; locally it is unset, so HMR works normally.

## Deployment

Hosted on Vercel as a static Vite build (`vite build` → `dist/`), with no `vercel.json` and no server code. The app has no client-side routing, so no rewrites are needed. Firebase stays the backend:
- Changes to `firestore.rules` are **not** deployed by Vercel; they must be published separately (Firebase console or `firebase deploy --only firestore:rules`).
- Google sign-in only works on domains listed under Firebase Auth → Settings → Authorized domains, so new Vercel domains must be added there.

## Architecture

- **`src/App.tsx`** holds essentially all state and data logic: auth listener, Firestore `onSnapshot` subscriptions, create/update/delete handlers, demo-data seeding, bulk clear, toasts. Components in `src/components/` are presentational and receive data + callbacks via props.
- **`src/firebase.ts`** initializes Firebase from `firebase-applet-config.json` (uses a named Firestore database via `firestoreDatabaseId`). Wrap Firestore write failures with `handleFirestoreError(err, OperationType.X, path)`, which logs and rethrows a JSON-serialized error with auth context.
- **`src/types.ts`** defines `Vacation` and `UserProfile` plus shared helpers (`getAutoColor`, `calculateDaysBetween` — inclusive day count, `PALETTE_COLORS`, `DEPARTMENTS`).

### Data model (Firestore)

- `vacations/{id}` — IDs are generated client-side (`vac_<timestamp>_<rand>`) and must match `^[a-zA-Z0-9_\-]+$`. Dates are `YYYY-MM-DD` strings (compared lexicographically); timestamps are ISO strings, not Firestore Timestamps.
- `users/{uid}` — profile doc auto-created on first login.

The schema is defined in three places that must stay in sync when fields change: `src/types.ts`, `firestore.rules` (`isValidVacation` / `isValidUserProfile` enforce required keys and string lengths), and `firebase-blueprint.json`.

### Permissions

Any signed-in user can read everything; users can only write their own vacations/profile. The admin is hardcoded as `kelvaneli@gmail.com` in **both** `firestore.rules` (`isAdmin()`) and `src/App.tsx` (`isAdmin`) — change both together.

### Offline fallback

Vacations and the user profile are mirrored to `localStorage`. On snapshot errors `syncStatus` becomes `'offline'` and the cache is used; writes while offline are applied only locally (IDs prefixed `local_`) and are not synced back to Firestore later.
