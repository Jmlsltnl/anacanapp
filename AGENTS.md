# Anacan working rules

Read `docs/WORKTREE_HISTORY.md` and `docs/APPLICATION_BASELINE.md` before release,
backend, native or deployment work. Their detailed continuity rules still apply.

- Develop the current `src/` worktree. Primary Azure web: `https://api.anacan.az`;
  reviewed code sync/publication to the existing Lovable project at
  `https://app.anacan.az` is also approved. Database/Auth stay on Source. Do not
  freeze writers, migrate accounts or switch admission as part of UI releases.
- Preserve accepted/pending Source lineage, writer open/generation0 and existing
  cron. Every new/changed data relation needs CDC and writer guarding.
- Keep `/brands` and `/brands/manage` web-only, with separate Source session/cache
  and server-side membership. Exclude `src/brand-portal/` from consumer inline
  localization and native bundles.
- Preserve native43/Store43 and older finalized workspaces. Use isolated candidates
  and production entitlements for new store packages. Keep `com.atlasoon.anacan`,
  team `8B6976J8H7`, widget/App Group, `app.anacan.az` WebView hostname, per-backend
  sessions, logout tombstones and one-way adoption receipts.
- Use explicit Azure build/config for Azure work. Source-generated `types.ts` and
  `previewAuthStorage.ts` stay generated; custom compatibility lives in
  `database-types.ts` and `authStorage.ts`.
- Preserve all21 languages and real-store pricing, eligibility, restore/pending
  and one-time offers. Compact onboarding contract: `docs/ONBOARDING_COMPACT.md`.
- Source Auth-hook binding/IP enforcement and RevenueCat v2 metrics permission
  remain operator dependencies; require live proof before claiming activation.
- Keep private inputs, signing material, sessions and ignored migration helpers
  out of logs/chat/Git/archives. Honor `.gitignore` when preparing code handoffs.
  Use existing private inputs/secret references; never replace them with samples.
