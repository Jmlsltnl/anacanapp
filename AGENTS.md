# Anacan working rules

- Develop the current Azure-designated application in `src/`; keep Source/Lovable as the live database and native compatibility target until a verified cutover. Why: primary development target does not imply population admission changed.
- Before claiming a mobile, data, Auth-writer, or store cutover, recheck live admission and follow `docs/AZURE_FINAL_SYNC_AFTER_APPROVAL.md`. Why: last verified admission is Source/generation 0.
- Preserve Source accepted/pending sync lineage; enroll every changed/new data relation in CDC and writer guarding before committing. Why: Source-first clients and the migration chain depend on them.
- Keep `/brands` and `/brands/manage` web-only, with separate Source session/cache and server-enforced brand membership; exclude `src/brand-portal/` from consumer inline localization. Why: native exposure and consumer auth imports disturb brand isolation.
- Preserve `com.atlasoon.anacan`, team `8B6976J8H7`, widget/App Group, `app.anacan.az` WebView hostname, session namespaces, logout tombstones, and one-way adoption receipts. Why: native identity and authority continuity.
- Keep existing native43/Store43 release assets and older finalized workspaces intact; use isolated native candidates and `--ios-store` for production entitlements. Why: avoid overwriting signed releases.
- Use explicit Azure mode/config for Azure web work; never infer target from a default Vite build or legacy `.env`. Why: the same source serves Source-first and Azure contexts.
- Keep credentials, signing material, and private sessions out of logs/chat/Git/archives; use existing private inputs and secret references. Why: prevent exposure.
- Treat Source Auth-hook binding/IP enforcement as an operator dependency, not an installed setting; do not claim it enabled without authenticated proof. Why: supported hook configuration is unavailable here.

Full dated release history, scoped implementation details, and delivery references: `docs/WORKTREE_HISTORY.md` and `docs/APPLICATION_BASELINE.md`. Read the relevant release contract before changing that area.
