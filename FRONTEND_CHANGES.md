# Frontend Changes

## Layout & tab-strip reliability pass

- **Fixed: clicking a tab to switch to it also popped open its "Close / Pin" menu.**
  `TabStrip.tsx` wrapped each entire tab row in a `DropdownMenuTrigger`, and Radix
  opens dropdown triggers on `pointerdown`, not `click` — so by the time our own
  click handler ran, the menu had already opened. Fixed by intercepting
  `onPointerDown` (calling `preventDefault()` so Radix's own handler never fires)
  and switching the action menu to a controlled `DropdownMenu` that only opens via
  right-click or the tab's own kebab-equivalent, exactly like every real tabbed
  editor (VS Code, browser tabs, Postman). Covered by
  `TabStrip.test.tsx` (4 tests) so this can't silently regress again.
- **Resizable, persisted layout** (`components/ui/resizable.tsx`, new — thin
  shadcn-style wrapper around `react-resizable-panels`). The sidebar↔main split and
  the request↔response console split are now drag-to-resize, remember their size
  across reloads (`autoSaveId`), and the console can be collapsed/expanded with one
  click via an imperative panel handle. Previously both were hardcoded (`w-[280px]`,
  `h-[40%]`) with no way to reclaim screen space — the exact "resize the console"
  gap flagged in review.

## Core Features pass (per APIFORGE_2.0_MASTER_ARCHITECTURE.md feature ranking)

Implemented, tested, and verified for real in this pass:

- **Tabs + URL-addressable navigation** (`DashboardContext.tsx` rewritten, `TabStrip.tsx`
  new). Multiple concurrent tabs, closable/pinnable, middle-click-to-close, "close
  others"/"close all". The active tab syncs to the URL (`?active=<tabId>`) and both
  the tab list and active tab persist to `localStorage`, so a refresh restores your
  session instead of dropping back to a blank state — the exact gap flagged in the
  Phase-0 audit, now actually fixed rather than patched.
- **Command palette** (`⌘K`/`Ctrl+K`, `CommandPalette.tsx`, new). Fuzzy-searches
  requests/mocks/environments in the active workspace, plus static actions (new
  scratchpad, toggle theme, jump to any sidebar module, open settings).
- **Scratchpad** — `RequestEditor.tsx` gained a `scratchpadId` mode alongside its
  existing `requestId` mode: an unsaved request that autosaves to `localStorage` on
  every change (300ms debounce) and offers "Save to Collection"
  (`SaveToCollectionDialog.tsx`, new) instead of a direct PUT. Reuses the existing
  request-builder UI rather than duplicating it.
- **Collections with folder nesting** (Core IA requirement) — backend: `parent_id` +
  `sort_order` columns (`V2` migration), cycle-prevention and same-workspace checks in
  `CollectionService`, a "move" operation via `PUT` with `parentId`/`clearParent`.
  Frontend: `RequestExplorer.tsx` now builds and renders a real recursive tree from
  `parentId` (previously a flat list), with "New subfolder" per node. Drag-and-drop
  reordering is **not** included in this pass — the tree renders and nests correctly,
  but reordering via drag is a follow-up.
- **Code generation snippets** (`lib/codegen.ts` + `CodeSnippetDialog.tsx`, new) — curl,
  JS `fetch`, Node `axios`, Python `requests`, generated from the request builder's
  live state, wired in via a new "Generate Code" button next to Send/Save.
- **Import: cURL + OpenAPI** (`lib/import/parseCurl.ts`, `lib/import/parseOpenApi.ts`,
  `ImportDialog.tsx`, all new) with a **preview-before-commit step** — nothing is
  written until you confirm the parsed request list, per the master architecture's
  explicit UX requirement (import tools that apply blind are the most common source of
  "it clobbered my folder structure" complaints). OpenAPI import supports JSON specs
  only (YAML would need an added parser dependency — noted as follow-up) and generates
  a minimal stub body from a requestBody schema rather than full JSON-Schema-aware
  example generation. **Postman and Insomnia collection import are explicitly not
  included** — each is a substantial parser in its own right; the dialog says so
  in-UI rather than silently omitting them.
- **Dark/light theme** — already existed (`next-themes`, toggle in `TopBar` and
  Settings); added a matching action to the new command palette.

### A real bug the tab redesign itself would have introduced, caught before shipping

Several components (`SettingsExplorer`, `LogExplorer`, `HistoryExplorer`,
`MockServerEditor`, `EnvEditor`, `TopBar`'s search-result click and profile/settings
menu items) called the old `setActiveEditor`/`setActiveEntityId` pair directly to
navigate. Under the old single-editor model that was correct. Under the new tab model,
naively keeping those as compatibility shims that mutate "whatever tab is currently
active" would mean **clicking a history item while a request tab is open would
silently overwrite that request tab's content** instead of opening a new one. Fixed by
routing every one of those call sites through the proper `open*` helpers (which
open-or-focus a real tab) or `closeTab` (for the two "close after delete" cases),
instead of leaving them on the raw setters.

### Explicitly deferred (not done in this pass, and why)

- **Local-first storage / offline read/write.** This is the single largest
  infrastructure item in the master architecture (§7) — a real implementation needs a
  local cache layer, conflict-aware sync, and careful testing, not a rushed
  `localStorage` shim bolted onto existing API calls. Building it hastily to check a
  box would produce something that looks done but isn't trustworthy for actual offline
  use. Recommend its own dedicated pass.
- **Postman/Insomnia import**, **drag-and-drop folder reordering**, **YAML OpenAPI
  support** — each noted above at its specific call-out.

### Verified for real

`npm install`, `npx vitest run` (40/40 passing, up from 16), and `npx tsc --noEmit`
(clean) all actually executed in this sandbox after every batch of changes — including
after the tab-navigation bug fix above, to confirm it didn't regress anything.
`next build` remains blocked only by the sandbox's Google Fonts network restriction,
unrelated to any code here.

---



The backend moved to `/api/v1` and added pagination to three endpoints
(`/requests/collection/{id}`, `/logs/server/{id}`, `/history/me`) plus two new
single-item endpoints (`/logs/{id}`, `/history/{id}`). Updated for that:

- **`lib/api.ts`**: base URL now points at `/api/v1` (backend still accepts the old
  unversioned paths during its deprecation window, but there's no reason for new
  frontend code to use them).
- **`RequestExplorer.tsx`, `TopBar.tsx`'s search index builder**: both fetch requests
  per collection; both updated to read `res.data.data` instead of `res.data`, since
  that endpoint is now paginated. Fetch a generous page size (200) since neither has an
  infinite-scroll UI yet — the collection tree and global search show everything at
  once. If a collection ever has more than 200 requests in practice, this needs real
  pagination UI, not just a bigger page size.
- **`LogExplorer.tsx`**: same fix, plus an actual "Load more logs" button now that the
  endpoint supports paging (previously just showed the first 50, silently).
- **`HistoryExplorer.tsx`, `DashboardShell.tsx`'s stats widget**: same `res.data` →
  `res.data.data` fix for `/history/me`.

### Two real bugs this surfaced (would have crashed, not just misbehaved)

Tracing every consumer of the endpoints above against the new paginated shape found:

- **`LogViewer.tsx` and `HistoryViewer.tsx`** both fetched an entire page of
  logs/history and did `.find(item => item.id === targetId)` client-side to show a
  single item's detail — a workaround for the backend not having a "get one" endpoint.
  This was already fragile (silently failed for anything not on the first page); once
  the list endpoint returned `{ data: [...] }` instead of a raw array, `.find` would
  have thrown outright (`res.data.find is not a function`). Fixed properly: the backend
  now has real `GET /logs/{id}` and `GET /history/{id}` endpoints, and both viewers call
  those directly instead of guessing.
- **`DashboardShell.tsx`'s home/stats view** did `histRes.data.length` and
  `histRes.data.slice(0, 5)` on what is now a paginated object, not an array — `.slice`
  on a plain object throws. This would have **crashed the entire dashboard home view**
  the moment the backend pagination shipped. Fixed to read `histRes.data.data` and
  `histRes.data.totalElements`, and to request exactly 5 items server-side instead of
  fetching 50 and slicing.

### One pre-existing bug fixed along the way (unrelated to pagination)

`HistoryExplorer.tsx` rendered `item.statusCode`, but the backend's field has always
been named `status` (confirmed against `RequestHistory`/`RequestHistoryResponse`) — so
every status badge in the history sidebar has always rendered blank/undefined. Fixed
the field name; also removed the now-unnecessary `entry.status || entry.statusCode`
defensive fallback in `HistoryViewer.tsx` now that the correct name is confirmed.
Also fixed `LogViewer.tsx` referencing a `log.body` field that has never existed on the
backend (the real fields are `requestBody`/`responseBody`) — the "Request Body" panel
in the log detail view has always silently rendered nothing; now shows the response
body, which is the field the backend actually populates.

## Testing & CI (new)

- Added Vitest + React Testing Library (`vitest.config.ts`, `vitest.setup.ts`).
  `npm test` / `npm run test:watch`.
- `src/lib/errors.test.ts`: 13 tests covering the error-message helper added in the
  last pass (status-specific messages, field errors, network errors, fallbacks).
- `src/components/workspace/CreateWorkspaceDialog.test.tsx`: a real component test
  (success path, backend-error path, disabled-until-valid state) proving the harness
  works end-to-end, not just for pure functions.
- `.github/workflows/ci.yml`: lint (non-blocking — see below), typecheck, test, build.
- Added `typecheck` script (`tsc --noEmit`).

**Honest note on lint:** running `npm run lint` for the first time surfaced ~50
pre-existing violations across the codebase (mostly `@typescript-eslint/no-explicit-any`,
plus two real `react-hooks` findings — `TopBar.tsx`'s `buildSearchIndex` is referenced
before its declaration in a `useEffect` dependency, and `DashboardContext.tsx` calls
`setState` directly in an effect body). None of these are things this pass introduced,
and fixing all of them is a real, separate chunk of work (typing ~15 files' worth of
`any` usage properly). Rather than either silently ignore lint or block CI on
pre-existing debt unrelated to this phase, the CI lint step runs and reports but is
`continue-on-error: true` for now, with a comment pointing back here. Recommend
tackling this as its own follow-up pass.

**Verified for real, not just written:** `npm install`, `npx vitest run` (16/16 pass),
`npx tsc --noEmit` (clean) all actually ran in this environment. `next build` could not
be fully verified — it fails only on a sandbox network restriction (can't reach
`fonts.googleapis.com` for `next/font`), unrelated to any code change here.

---

Full read-through of the repo against the hardened backend, plus a pass of general
polish. Summary below — see git history / diffs for line-level detail.

## Fixed: backend-compatibility bugs

- **`api.ts`**: added a response interceptor that clears local storage and redirects
  to `/login?sessionExpired=1` on any `401`, instead of every component having to
  handle "my token died" separately.
- **`lib/errors.ts`** (new): a single `getErrorMessage(error)` helper that reads the
  backend's structured error body (`{ message, fieldErrors, ... }`) and returns a
  clean, human string — replacing code that either showed nothing, showed a raw JSON
  blob, or showed a hardcoded generic string regardless of what the backend said.
- **Login page**: now parses the JSON error body instead of guessing from the status
  code alone, and handles `429` (the backend's new login rate limiter) with its own
  message instead of showing the unrelated "server is waking up" banner. Also shows a
  toast when arriving via a forced session-expiry redirect.
- **Signup page**: parses the JSON error body (previously read the response as raw
  text and `alert()`'d it verbatim) and surfaces field-level validation errors (e.g.
  "email: must be a valid email") individually.
- **All 33 `alert()` calls** across the live app replaced with `sonner` toasts showing
  the real backend message. The `Toaster` component existed in the codebase
  (`components/ui/sonner.tsx`) and `sonner` was already a dependency, but it was never
  mounted — it's now added to the root layout.

## Fixed: two real regressions caught by tracing the frontend against the new backend

These would have broken working features the moment the hardened backend shipped, so
they're fixed on the **backend** side (included in `apiforge-backend-hardened.zip`):

- `ApiRequestDto.url` was marked `@NotBlank`, but the "Create Request" dialog
  intentionally creates a request with an empty URL (filled in afterwards in the
  editor). This would have made **every new request creation fail** with a 400.
  Fixed by removing that constraint.
- `CollectionRequest.workspaceId` and `ApiRequestDto.collectionId`/`workspaceId` were
  `@NotNull`, but the same DTOs are reused for **update** calls that only send the
  editable fields (e.g. renaming a collection only sends `{ name }`). This would have
  made renaming a collection or editing a saved request's fields fail with a 400.
  Fixed by making those fields optional on the DTO and checking them explicitly inside
  the create-only service methods instead.
- Added `PUT /api/workspaces/{id}` on the backend — `SettingsEditor.tsx` already called
  this to support renaming a workspace, but the endpoint never existed, so that feature
  was silently broken.

## Cleaned up: dead code

Tracing every route found that `src/app/dashboard/layout.tsx` renders `DashboardShell`
directly and never renders `{children}`. That means none of the following ever
actually rendered, no matter the URL — the whole app runs through the single
`DashboardShell` + `DashboardContext` client-state shell instead:

- `src/app/dashboard/profile/page.tsx`
- `src/app/dashboard/request-hub/page.tsx`
- `src/app/dashboard/mock-server/page.tsx` and `mock-server/[serverId]/page.tsx`
- `src/app/dashboard/environments/page.tsx`
- `src/app/dashboard/history/page.tsx`
- `src/app/dashboard/logs/page.tsx`
- `src/components/layout/SideBar.tsx` (an old link-based sidebar, superseded by the
  icon rail in `DashboardShell.tsx`)

All removed. `src/app/dashboard/page.tsx` was replaced with a one-line stub (Next.js
still needs *a* page for the `/dashboard` route to resolve, but its previous ~200-line
duplicate "dashboard home" implementation could never render, so it's gone).

Also removed `src/components/environment/EnvironmentManager.tsx` — unused anywhere,
and its "Save" button just showed an alert saying the backend endpoint didn't exist
(it does; `EnvEditor.tsx` is the real, working implementation).

**If any of the above was actually reachable in a way this review missed, everything
here is additive on top of your original zip — nothing was force-pushed anywhere.**

## Added: a real feature from the leftovers

`RenameCollectionDialog.tsx` was fully built but only wired into the now-deleted
`request-hub/page.tsx`, so it was unreachable. It's now wired into the live
`RequestExplorer.tsx` (the collections/requests sidebar you actually use), which also
gained a "Delete collection" action and a working search/filter box — the filter input
was present visually before but wasn't hooked up to anything.

## Polish

- `MockRouteEditor.tsx`: delay input is now capped at 30,000ms and failure rate at
  100% client-side, matching the backend's hard limits, so the UI never shows a value
  quietly different from what got saved.
- `RequestEditor.tsx`: proxy-execution errors now show the backend's actual message
  (e.g. "Requests to private, loopback, link-local, or metadata addresses are not
  allowed") instead of a generic failure — relevant if you try to proxy a request to
  `localhost`, which the backend's SSRF guard now intentionally blocks. Save failures,
  which previously failed silently, now show a toast.

## Known follow-ups (not done here)

- The dashboard's navigation state (`activeModule`/`activeEditor`/`activeEntityId`)
  lives only in React state, not the URL — refreshing the page or using browser
  back/forward always resets to the default view. Fixing this properly (syncing state
  to the URL via search params) is a real architectural change and was left out of this
  pass as out of scope.
- `HistoryViewer`'s "Restore to Editor" always restores with empty headers/body,
  because `RequestHistory` on the backend never stored them in the first place (only
  method/url/status/duration/timestamp). Fixing this needs a backend schema change
  (new columns + Flyway migration) that wasn't in scope here.
