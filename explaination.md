# Monorepo wiring — what was built and why

Four things were asked for and all four are done and verified running:

1. the `shared-types` package,
2. a feature-based module structure in Nest,
3. Next.js connected to Nest,
4. root scripts.

Everything below describes the repo as it now stands.

---

## 0. The shape of the repo

```
workout-tracker/
├── package.json            # root scripts, turbo, pnpm version
├── pnpm-workspace.yaml     # apps/*, packages/*
├── turbo.json              # task graph
├── apps/
│   ├── api/                # Nest 11  → http://localhost:3001/api
│   └── web/                # Next 16  → http://localhost:3000
└── packages/
    └── shared-types/       # TypeScript contracts, no build step
```

Dependency direction is one-way: `web → shared-types` and `api → shared-types`. The two apps never import each other; they only agree on the contract in the middle.

---

## 1. `packages/shared-types`

### What it contains

| File | Contents |
| --- | --- |
| `src/session.ts` | `Session`, `SessionDetail`, `CreateSessionDto`, `UpdateSessionDto` |
| `src/exercise.ts` | `Exercise`, `ExerciseWithSets`, create/update DTOs |
| `src/exercise-def.ts` | `ExerciseDef`, `ExerciseMuscle`, `ExerciseDefWithMuscles`, create/update DTOs |
| `src/set.ts` | `WorkoutSet`, create/update DTOs |
| `src/api.ts` | `ApiErrorBody`, `HealthStatus`, `API_ROUTES` |
| `src/index.ts` | re-exports all of the above |

The entities come straight from the five tables in `dev.md`. Three naming decisions worth flagging:

- **`WorkoutSet`, not `Set`** — `Set` is a JavaScript built-in; shadowing it in every file that imports the package is a trap.
- **`camelCase` fields** (`exerciseDefId`, `setNo`, `reps`) — these are JSON wire types, not SQL rows. Whatever DB layer arrives later maps `exercise_defid → exerciseDefId` in one place.
- **`exercise_muscle` was assumed to hang off `exercise_def`, not off a performed `exercise`.** `dev.md` writes the column as `exerciseid`, which is ambiguous. "Bench press works chest" is a property of the exercise *definition*, not of one performance of it, so `ExerciseMuscle.exerciseDefId` is what got modelled. If you meant per-performance muscle tagging, this is the one type to change.

The `*WithX` types (`SessionDetail`, `ExerciseWithSets`, `ExerciseDefWithMuscles`) are **read models** — the nested shapes the API actually returns, kept separate from the flat table rows.

### No build step (and the one rule that makes it work)

`package.json` points `main`/`types` straight at `src/index.ts`. There is no `dist`, no `tsc -b` to wait on, no stale-build class of bug.

That works because **the package is types-plus-one-const**, and:

- **Next/Turbopack** transpiles workspace packages automatically (confirmed in `node_modules/next/dist/docs/.../transpilePackages.md` — no `transpilePackages` entry needed).
- **Nest** does *not* compile anything under `node_modules`. So the API must never import a **value** from this package — only `import type`. Every API import is written that way. Type imports are erased at compile time, so nothing needs to exist at runtime.

`API_ROUTES` (the one runtime value) is therefore consumed by the web app only. If the API ever needs runtime values from here, this package has to grow a real build step and `exports` map — that is the tripwire to watch for.

Two details that cost a build failure while wiring this up, worth knowing:

- Relative imports inside the package are **extensionless** (`from './exercise'`). They started as `./exercise.js` — `tsc` accepted it, Turbopack did not resolve `.js → .ts` and the web build failed with *"The module has no exports at all."*
- `"type": "module"` was **removed** from the package for the same reason: without it, Nest's `nodenext` resolution treats the files as CommonJS and extensionless imports are legal on both sides.

---

## 2. Feature-based module structure in Nest

### Layout

```
apps/api/src/
├── main.ts                 # bootstrap: /api prefix, validation, CORS, port
├── app.module.ts           # wires features together, owns nothing
├── common/
│   ├── store.ts            # in-memory data, the future DB seam
│   ├── store.module.ts     # @Global() provider
│   └── seed.service.ts     # demo data on boot
└── modules/
    ├── health/             # controller only
    ├── exercise-defs/      # controller · service · module · dto/
    ├── exercises/          # controller · service · module · dto/
    ├── sessions/           # controller · service · module · dto/
    └── sets/               # controller · service · module · dto/
```

The generated `app.controller.ts`, `app.service.ts` and their spec were deleted. `AppModule` now has **no controllers and no logic** — adding a feature is one import line.

Each feature folder holds everything for that slice: HTTP surface (controller), rules (service), DI wiring (module), input shapes (`dto/`). To delete a feature you delete a folder and one import.

### Endpoints

All under the `/api` global prefix:

| Feature | Routes |
| --- | --- |
| health | `GET /api/health` |
| exercise-defs | `GET`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| exercises | `GET ?sessionId=`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |
| sessions | `GET`, `GET /:id` (nested detail), `POST`, `PATCH /:id`, `DELETE /:id` |
| sets | `GET ?exerciseId=`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` |

### How the modules depend on each other

```
sessions → exercises → exercise-defs
                    ↘  sets
all features → Store (global)
```

Deliberately acyclic. The interesting case is `sets` ↔ `exercises`: `exercises` needs `SetsService` to build `ExerciseWithSets`, and `sets` needs to check that its parent exercise exists. If both injected each other, Nest would need `forwardRef`. Instead **`SetsService` checks the parent through `Store` directly** and never injects `ExercisesService`, so the arrow only points one way.

Cross-feature access always goes through an **exported service**, never through another feature's internals — `ExercisesService` calls `exerciseDefs.findOne()` to validate a definition, which also gives it the correct 404 for free.

### DTOs bridge the type package to runtime validation

```ts
export class CreateSessionDto implements CreateSessionContract {
  @IsOptional() @IsDateString() date?: string;
}
```

The class `implements` the interface from `shared-types`, so **if the shared contract changes and the DTO does not, the API stops compiling**. The decorators add what a TypeScript interface cannot: validation of untrusted JSON at runtime.

`main.ts` turns that on globally with `whitelist` (strip unknown keys), `forbidNonWhitelisted` (400 instead of silently dropping them — client bugs surface immediately), and `transform` with implicit conversion (so `@IsInt()` sees a number, not a string).

### Data layer

`Store` is a single injectable holding five arrays. It is **not** the final design — it is the seam. Swapping in SQLite/Prisma means replacing that one provider; no controller and no route shape changes. `SeedService` inserts one realistic workout on boot so the UI has something to show; set `SEED_DATA=false` to skip it. **Data does not survive a restart.**

---

## 3. Connecting Next.js to Nest

There are two paths, on purpose, because server and browser code have different constraints.

### Path A — Server Components (the default)

`apps/web/lib/api.ts` is a typed client that starts with `import 'server-only'`. Importing it from a Client Component is a **build error**, so `API_URL` and any future credentials cannot leak into the browser bundle.

```
Browser ──HTML──> Next server ──fetch(API_URL/api/...)──> Nest
```

`app/page.tsx` is an async Server Component that awaits `api.listSessions()`. The browser receives rendered HTML and no API URL.

Two Next 16 specifics that this depends on:

- **`await connection()` at the top of the page.** Without it the route was prerendered at build time — when the API is not running — and every visitor would have been served baked-in "Could not reach the API" HTML. The build output confirms the fix: the route went from `○ (Static)` to `ƒ (Dynamic)`.
- **`fetch` is not cached by default in Next 16**, so reads are always fresh with no `cache: 'no-store'` needed. Caching is now opt-in per call.

### Path B — the `/api/*` rewrite (for the browser)

`next.config.ts` proxies `/api/:path*` to `${API_URL}/api/:path*`. Client Components can call `fetch('/api/sessions')` with no base URL, no CORS preflight, and no API host in the bundle. Nest still sets CORS (`WEB_ORIGIN`, default `http://localhost:3000`) for direct browser calls, but proxied traffic is same-origin and never needs it.

### Mutations — Server Actions

`app/actions.ts` (`'use server'`) calls the server-only client, then `refresh()` from `next/cache` to re-render with the new data. `app/new-session-form.tsx` is the page's **only** Client Component; it uses `useActionState` for the pending state and never touches `lib/api.ts`.

### Environment

`apps/web/.env.example` and `.env.local` define `API_URL=http://localhost:3001`. No `NEXT_PUBLIC_` prefix — deliberately, so the value stays server-side. `.env.local` is gitignored; `.env.example` is the committed template.

### Ports

`note.md` had *"TODO: fix port in package.json"* — that is resolved. Next keeps **3000**, Nest moved to **3001** (`PORT` env, default in `main.ts`). They previously collided on 3000.

---

## 4. Root scripts

```jsonc
"dev":       "turbo run dev",                            // both apps together
"dev:web":   "turbo run dev --filter=@workout/web",
"dev:api":   "turbo run dev --filter=@workout/api",
"build":     "turbo run build",
"lint":      "turbo run lint",
"typecheck": "turbo run typecheck",
"test":      "turbo run test",
"test:e2e":  "turbo run test:e2e",
"format":    "turbo run format",
"clean":     "turbo run clean && rm -rf .turbo"
```

`pnpm dev` from the root is now the single command — it starts Nest and Next side by side.

Supporting changes:

- **All packages renamed to a scope**: `@workout/web`, `@workout/api`, `@workout/shared-types` — so `--filter` targets are unambiguous.
- **`turbo.json` rewritten**: the old file used `"pipeline"`, which **Turborepo 2.x no longer accepts** (renamed to `"tasks"`). It also gained `typecheck`, `test`, `test:e2e`, `format`, `clean`; `.next/cache/**` is excluded from cached outputs, and `API_URL` is declared in the `build` task's `env` so changing it busts the cache.
- **`typecheck` script added to every package** (`tsc --noEmit`); the API also gained `dev` as an alias of `start:dev`.
- **`packageManager` moved** from `apps/web/package.json` to the root, where it belongs.
- **`apps/web/pnpm-workspace.yaml` and `apps/web/pnpm-lock.yaml` deleted** — a nested workspace root inside a workspace confuses pnpm; the `allowBuilds` entries were merged into the root `pnpm-workspace.yaml`.
- **`.gitignore` rewritten** as one comprehensive root list: dependencies, build output (`.next/`, `dist/`, `out/`, `build/`, `coverage/`), `.turbo/`, `*.tsbuildinfo`, `next-env.d.ts`, logs and runtime files, editor dirs, OS cruft, and env files.

  The env rule is `.env` + `.env.*` followed by `!.env.example`, so secrets stay local while the template stays committed. **`apps/web/.gitignore` needed the same negation** — `create-next-app` ships a blanket `.env*` there, which was silently ignoring the `apps/web/.env.example` added in this work. Confirmed fixed with `git add -n`: `.env.example` is addable, `.env.local` is still refused.

  The per-app `.gitignore` files from `create-next-app` and `nest new` were left in place — their rules now duplicate the root's, but keeping them means either app still works if it is ever extracted from the monorepo. Say the word if you'd rather consolidate to the root file alone.

---

## Verification

Everything below was actually run, not assumed:

| Check | Result |
| --- | --- |
| `pnpm install` | 4 workspace projects linked |
| `pnpm typecheck` | 3/3 packages clean |
| `pnpm build` | api + web build; `/` reported as `ƒ (Dynamic)` |
| `pnpm lint` | clean |
| `pnpm test` | 4 unit tests pass (`SetsService`) |
| `pnpm test:e2e` | 4 e2e tests pass |
| `pnpm dev` | both apps up, ports 3000 / 3001 |
| `curl :3001/api/health` | `{"status":"ok","uptimeSeconds":20}` |
| `curl :3000/api/sessions` | seeded session returned **through the Next rewrite** |
| `curl :3000/` | SSR HTML contains `Bench Press`, `Barbell Row`, `60kg × 8 @7` |
| `POST :3000/api/sessions {"date":"nope"}` | `400 "date must be a valid ISO 8601 date string"` |

Tests added: `apps/api/src/modules/sets/sets.service.spec.ts` (set numbering, RPE defaulting, unknown-parent rejection, cascade delete) and a rewritten `apps/api/test/app.e2e-spec.ts` (health, full create-and-read-back flow, unknown-key rejection, 404). The old placeholder e2e test asserted `GET / → "Hello World!"`, which no longer exists.

---

## What is deliberately not done

- **No database.** `Store` is in-memory; restarting the API wipes everything. The five tables from `dev.md` are modelled in the types and the store, so adding SQLite/Prisma is a swap of one provider.
- **No auth.** No users table exists yet, and every route is open.
- **The home page issues one request per session** (`listSessions`, then `getSession` for each). Fine at demo size; the fix when history grows is a `GET /api/sessions?include=exercises` endpoint rather than client-side looping.
- **The Tauri desktop shell from the previous version was not re-added.** The old `src-tauri/` and root-level `app/` files are still showing as deleted in git status from before this work; nothing here touched them.
- **`apps/api/.git/` exists** — a nested git repository left over from `nest new`. It is not a submodule, so git will not track the API's contents properly from the root. Deleting `apps/api/.git` is the fix, but that destroys any history in there, so it was left alone for you to decide.

## Running it

```bash
pnpm install
pnpm dev            # http://localhost:3000  +  http://localhost:3001/api
```
