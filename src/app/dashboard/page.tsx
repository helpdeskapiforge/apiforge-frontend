// This route exists only so Next.js has a valid page for the `/dashboard` segment.
//
// The actual UI is rendered entirely by `dashboard/layout.tsx`, which mounts the
// single-page app shell (`DashboardShell`) directly and does not render `{children}`.
// Navigation between "Requests", "Mock Server", "Environments", etc. happens through
// client-side state (see `DashboardContext`), not through separate routes/pages.
//
// This file previously contained a full, ~200-line duplicate dashboard-home
// implementation that could never actually render for that reason -- DashboardShell
// already has its own equivalent home view. Removed to avoid two copies drifting out
// of sync; see AUDIT.md / the frontend cleanup notes for details.
export default function DashboardPage() {
  return null;
}
