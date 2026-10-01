# Anacan working baseline

## User-designated primary application

- As of 2026-09-13, the user designated the Azure-deployed application at
  `https://api.anacan.az` as the primary application for all subsequent work.
- Continue from the current Azure code/worktree (published 30.0, iOS 39.0 store candidate). Implement
  future fixes/features against Azure; the old Lovable/Supabase deployment is a
  legacy migration/compatibility source, not a parallel development target.
- Current baseline and delivery links: `docs/APPLICATION_BASELINE.md`.
- On2026-10-01 the user requested bringing the current application files into
  parity with the existing Lovable project, enabling the Source Auth hook there,
  and a web-only brand advertising portal with brand-scoped email/password login.
  Continue from this worktree; reviewed application-code synchronization and
  deployment to that same Lovable project are now within the requested scope.
  Keep the database on Source and preserve all delivered native43/Store43 assets.
  The brand portal must have its own web route/session and tenant authorization;
  do not expose it as a native application screen.
- On2026-09-30 the user requested fixing the current application and producing
  Android/iOS release packages while keeping the database on Lovable/Source.
  Do not perform an Azure population cutover, change admission to Azure, freeze
  Source writers, or migrate Source account data as part of this release. Use the
  same current worktree with verified Source compatibility and a new isolated
  native candidate. Preserve delivered artifacts and the Store39 workspace.
  The user explicitly approved using the existing Lovable project's agent only
  to deploy prepared/reviewed Source server-function changes for this release.
- The 2026-09-30 Source release43 now has all localization21/admin/regional/
  followup36/37/ad-moderation/moderator prerequisites installed and29 reviewed
  Source functions deployed through that approved Lovable task. Source has276
  relations/17 runtime receipts, writer open/generation0 and its original5 cron;
  accepted/pending lineage and SQL34/35 hashes are preserved. The Source-backed
  static UI is `https://anacan-source-release.grayocean-6fd65b89.westeurope.azurecontainerapps.io`.
  `anacan-source-ad-moderation` runs every minute with scoped worker transport
  (image `1deb9d3832bce843c1b82c2fe4ff28959ab5a1a339d120f2e7cbbf0b6a1d4575`).
  Native43 development `native-20260930t144622-b4a6e3ba` has verified signed
  APK/AAB/development IPA,504 asset hashes and current Customer.io93570 configuration.
  Its Source API, onboarding and native-bundle communication acceptance passes.
  Store43 is separate `native-20260930t160219-8686f93e`; require the final
  `ops/release43-store-package.json` capability/signature acceptance, not merely
  export exit0 (the first unsigned-archive export lost native capabilities).
  Final Store43 acceptance now passes with production push/HealthKit/Apple Sign-In/
  widget App Group intact. Delivered packages are in `azure-migration/releases/43.0/`;
  App Store IPA SHA256 is `93d0571b44cdce5287e6a41e2976524eef9a2873cf59cf7c917bdaeaf1c77bbf`.
  Source Auth-hook binding/IP enforcement and RevenueCat v2 metric permission
  remain external operator dependencies. No store upload or Azure cutover is
  implied. Current contract: `docs/RELEASE_43_SOURCE.md`.
- The 2026-09-29 Moderator/Data In release is gateway v41 / `--0000043`
  (ACR cb26, digest `54e1645e42fd5b985d79f635215e58fb3ed971453e3c2e1eb5e4f31a963032bf`),
  Functions13 (23 enabled routes), Auth7, REST `--0000001`, Storage9 and SQL33.
  `/moderator` is independent of Admin and includes scoped restrictions, one-time
  acknowledged warnings, audited content actions, pins, tasks/appeals and exact-IP
  signup rules. Gateway-owned XFF/Sb-Forwarded-For and the GoTrue hook are configured;
  IP mode is enforce. The shared real address was not blocked in the live canary.
  All21 deployed UI languages,25 SQL/CDC tests and real owned API fixtures pass.
  Customer.io Data In uses official iOS/Android SDKs through Capacitor; EU SDK
  identify/track/screen ingestion returned HTTP200. MCP/source-events inspection is
  unverified. Native42 `native-20260929t044212-2dfb3aec` has verified signed Android
  APK/AAB; full iOS42 archive timed out and remains pending. Preserve finalized41
  and Store39. Source installation/worker/UI remains an operator handoff; admission
  remains Source/generation0. See `docs/MODERATOR_CONSOLE.md`,
  `docs/SOURCE_MODERATOR_CONSOLE.md` and `docs/CUSTOMERIO_DATA_IN.md`.
- The later 2026-09-29 Customer.io requirement is continuous automatic Source user
  synchronization, including initial backfill and future account/profile/child/
  subscription changes and deletions. The shared SQL34/outbox, Source CDC/guard
  wrapper and minute-scheduled Azure worker are prepared under
  `azure-migration/customerio-sync/`; the contract is `docs/CUSTOMERIO_AUTOMATIC_SYNC.md`.
  Source installation completed through Lovable OAuth on2026-09-30 (project
  `e07ee1f9-3d58-48fe-a7a0-068ecf028173`, runtime hash
  `f9f1a7c20cbc963c8b0b92d479611b069b0b8cbcf2807ddfa66596281df802dd`).
  Source Supabase credentials are no longer required: `azure-migration/lovable-bridge/`
  uses Lovable OAuth/MCP, with a separate authenticated Customer.io OAuth connection.
  Customer.io inspection corrected the source to93570 (destination35292/key94417);
  the previous93520 reference and local key were stale. The private server profile
  uses the verified key. All14,728 profiles are now confirmed in Customer.io with
  zero pending/failed rows; the five largest families are fully verified. The
  minute-scheduled `anacan-customerio-source-sync` job is live with image digest
  `943b531803b3e5862b993be1df0f0c72ac1424efc2b2ce8a5b1c9cb121ef0ea4`.
  Large children arrays use lossless1KB attribute parts;31 SQL/worker/deploy tests,
  11 OAuth/MCP tests, and live Source/destination checks pass. Source lineage is
  preserved. No native package/cutover is implied; old embedded native profiles
  require reconciliation before a new candidate. Manual SQL/CSV is superseded.
  See `docs/CUSTOMERIO_LOVABLE_CONNECTION.md` and the destination verification receipt.
- The 2026-09-30 Customer.io audience followup adds33 dynamic segments, including
  12 stage-specific non-Premium inactivity cohorts (7/14/30/60 days). Source
  `source-customerio-audiences-v1` hash is
  `543a37f81fcbc685d50b7a2fa47a27e292591a1e8da0448ec6a485e5b510a68b`; its single
  new facts relation is CDC/writer guarded. SQL34's original file/receipt is intact.
  `anacan-customerio-billing-sync` runs every minute with image digest
  `5ace3da199df58e3a3beedfea19e1c1f8138970440129edf3969844cc0577822`.
  14,735 billing snapshots were checked;33 counts/rules and27 membership-exclusion
  checks pass.37 focused tests pass.72 zero-price histories with earlier periods
  remain explicitly unknown and are excluded from never-paid/trial-only claims.
  The v1 RevenueCat read works; v2 project-list still returns403. Customer.io OAuth
  now includes write for the user-requested segments. Contract: `docs/CUSTOMERIO_SEGMENTS.md`.
- The 2026-09-27 Community advertising moderation release is gateway v40 /
  `--0000041` (ACR cb23, digest `c50b9a33501301d60094f5caa0e8e33587304dce96db036248c7c8964772a5ff`).
  SQL32 holds every new/edited post server-side until automatic clearance or admin
  review. Referenced media cannot be swapped after review. All21 languages, admin
  decisions/audit, author inbox/push and fixed `jamil@anacan.az` email outbox are supported.
  A separate minute-scheduled `anacan-community-ad-moderation` Azure job uses ACR cb22,
  digest `ab33907d754c47a3790895617b842472bc0928e7e557202e5e6f74ac813ed30f`.
  198 focused app tests,16 SQL/CDC tests,32 worker tests,49 real-model text and3
  synthetic-image checks pass; all21 deployed UI languages and a19-second real
  scheduled-worker canary pass. Source installation/worker/UI acceptance remains
  open: `docs/SOURCE_COMMUNITY_AD_MODERATION.md`. Contract/evidence:
  `docs/COMMUNITY_AD_MODERATION.md`. Functions12/23 routes, Storage9 and native
  admission Source/generation0 remain; preserve finalized native41 and Store39.
- The 2026-09-26 Premium placement followup is gateway v39 / `--0000040` (ACR
  cb20, digest `8a2a80068cb66c64cc28145e0bbe1dc40d0e6eb72633281ad6a0bc81f313852a`).
  The ad-free Premium card gets one top introduction, then stays at the end of
  subsequent dashboard visits, using a backend/account-scoped local UI marker.
  WinBackCard and its three-day-return copy are removed from dashboard/Billing.
  Contract/evidence: `docs/PREMIUM_OFFER_PLACEMENT.md`. This is a web release;
  preserve delivered native41 artifacts and use a new isolated candidate for
  subsequent native changes. Functions12, Storage9, SQL31 and Source/generation0
  remain the backend baseline.
- The 2026-09-26 header/splash followup is gateway v38 / `--0000039` (ACR cb1y,
  digest `a26e52f6c5ec708553354404580158a131b36ff1d520629b8fb2c91f2fb5ba5b`).
  It unifies the transparent-edged logo/startup presentation and separates nested
  scrolling from safe-area header space.81 focused tests and all21 deployed
  header-language checks pass. Native41 is the isolated development candidate
  `native-20260926t051303-30913459`; actual package/physical-check status is in
  `docs/HEADER_SPLASH_38.md`. Keep finalized39/40 and the Store39 workspace intact.
  Functions12, Storage9, SQL31 and Source/generation0 stay as the backend baseline.
- The 2026-09-25 followup is gateway v37 / `--0000037`, Functions12 (23 enabled
  routes), Storage9 and SQL31 on Azure. It adds bounded Premium expiry/refund
  grants, background-audio revocation, Community /Blog cards/captions and Mommy
  period tracking without a module switch.1113 app tests and all21 deployed UI
  language checks pass. Source operator acceptance remains open; the309-SQL /
  18-function handoff is in `docs/SUPABASE_FOLLOWUP_37.md`. Native40 is the isolated
  source-first development candidate `native-20260925t060538-3642ac8e`, described
  in `docs/NATIVE_40.md`; physical iOS capture exclusion is unverified with no
  device connected. Keep finalized39 and its Store upload workspace intact.
  Release evidence: `docs/FOLLOWUP_37.md`. Admission remains source/generation0.
  Gateway images normalize public document-root permissions and run real nginx
  HTTP checks during build, including when preparation uses a private umask.
- The 2026-09-24 followup is gateway v36 / `--0000034`, Functions11 (23 enabled
  routes) and Storage9, with SQL30/public data installed on Azure. It adds140 names
  per expansion country,21-language Kegel/phase content and maternity rules,
  scoped AI sections, keyboard/media fixes, article sharing and per-admin badge
  visibility.1097 app tests,13 live API/browser groups and all21 deployed language
  checks pass. Source acceptance remains open; all SQL/function files and their
  catalog-regeneration order are in `docs/SUPABASE_FOLLOWUP_36.md`. Release evidence:
  `docs/FOLLOWUP_36.md`. Admission remains source/generation0; finalized39 is intact.
- The 2026-09-24 regional follow-up is gateway v35 / `--0000033` (Functions10,
  23 enabled routes), with SQL28/29 installed on Azure. It adds48 reviewed healthcare
  entries across12 countries,138 country-vaccine records/342 schedule rows and strict
  Community language filtering before pagination. Group discovery uses the creator's
  language at creation; inbox/membership access stays on v3. Unread state is scoped by
  backend/user/language.1059 app tests and all21 deployed browser checks pass:
  `docs/REGIONAL_21.md`. Source regional/community installers are reviewed handoffs,
  not operator-accepted; regenerate each pending catalog-pinned installer after the
  preceding DDL. Native39 remains separately finalized.
- The earlier Premium v34 / `--0000032` adds source-bound Premium copy and the
  low-memory public-content ESM asset builder; its all21-language acceptance is
  retained in v35. The user's strict language requirement supersedes global priority.
- The 2026-09-24 language release adds Vietnamese, Hindi, Japanese, Korean, Polish,
  Dutch and Swedish: the current bundle exposes 21 languages. Gateway v33 /
  `--0000031`, Functions `--0000010`, SQL27 and all public-content backfill are
  accepted on Azure, with 23 enabled routes. All twelve expansion bundles passed
  deployed browser/asset checks; 1010 app tests pass. Contracts and evidence:
  `docs/LOCALIZATION_21.md`. Source's reviewed successors are localization v2 and
  admin v3 (`RUN_SOURCE_LOCALIZATION_21_INSTALL.sql`, `RUN_ADMIN_CONSOLE_21_INSTALL.sql`);
  their operator acceptance remains open. Regenerate each catalog-pinned installer
  after installing the other. All twelve new server language rows remain inactive
  for legacy clients. Finalized39 native workspaces are not 21-language releases.
- The initial 2026-09-23 admin web release was gateway v31 / `--0000029`, Functions
  `--0000008`, with 23 enabled routes. New campaigns use the separately guarded
  `admin-notification-dispatch`; legacy `send-bulk-push` and population gates stay
  closed. SQL24/25 are installed on Azure. Source's reviewed admin installer and
  two new Edge Functions still require operator acceptance, and RevenueCat metrics
  currently returns 403 until the server key gains read access. Contracts, evidence
  and remaining steps: `docs/ADMIN_CONSOLE_40.md`. Do not claim a native40 release
  or modify finalized39 workspaces on the strength of this web deployment.
- The earlier 2026-09-23 expansion added Simplified Mandarin (`zh`), Indonesian,
  French, Spanish and European Portuguese. Its SQL26 / Functions9 / gateway v32
  evidence remains in `docs/LOCALIZATION_14.md`; use the 21-language successors
  above for current Source installation and release work.
- The 2026-09-22 advertising continuity revision uses `source-mirror-v1` in the
  39.0 candidate and the installed `source-admob-continuity-v1` runtime. It keeps a
  validated mirror in the already guarded/CDC app_settings relation, adds no cron,
  and exposes an independent sticky Source emergency stop. Contracts and evidence:
  `docs/ADMOB_CONTINUITY_39.md`. Completed 38.0 packages retain the older Azure
  config transport. Use the generated `RUN_SOURCE_ADMOB_INSTALL.sql`, not its raw
  template, for reviewed operator installation; preserve installed runtime hashes.
  Signed 39.0 test packages are finalized in
  `native-20260922t142744-d625d7ad`; continue later native changes in a new isolated
  workspace. The last physical iOS readiness check had no connected device.
- The current iOS upload workspace is the separate production-entitlement 39.0
  `native-20260922t173908-102f5a44`; instructions and store advertising disclosures:
  `docs/IOS_STORE_39.md`. Keep the finalized 39.0 development artifacts and older
  31.0 store workspaces intact. Upload/distribution remains in the user's Xcode account.
- The 2026-09-22 character-led onboarding uses the 38.0 Source-first workspace,
  all nine languages and confirmed profile/child/preference writes. New trial
  offers are retired; the paid annual first-year $19.99 / renewal $29.99 contract
  and the one-time monthly coffee exit offer
  and manual console setup are in `docs/ONBOARDING_38.md` and
  `docs/ONBOARDING_STORE_OFFER.md`. Store products/offers must be configured before
  the discounted native purchase is available; UI never fabricates a store price.
  Source-first Azure-outage behavior and its authority-pin limits are documented
  in `docs/AZURE_OUTAGE_SOURCE_FIRST.md`.
- The 37.0 polish includes Story like animation, complete communication labels,
  Premium badge refresh and reviewed Source Storage platform schema adoption:
  `docs/COMMUNITY_POLISH_37.md`. Trial/pricing history is `docs/TRIAL_AND_PRICING.md`.
- The 2026-09-21 group revision replaces category groups with Public/Private
  messaging groups, creator approvals/moderation, inbox integration and post tags.
  Current 36.0 workspace and contract: `docs/GROUP_CHATS_36.md`.
- The 2026-09-21 communications work uses the 35.0 source-first test workspace;
  current contracts, runtime revisions and delivery evidence: `docs/COMMUNICATIONS_35.md`.
  This does not designate a new published store version or completed Azure admission.
- As of 2026-09-20, the user also requires the current source-first native release
  to remain functional on the Source/Lovable backend, including current features
  and AdMob, until the verified Azure cutover. Deliver this as a reviewed
  compatibility contract from the same application code, not a separate fork.
  Source SQL changes must preserve the accepted/pending sync chain and enroll
  any changed/new data relations in CDC and writer guarding before commit.

## Runtime facts to preserve

- Primary-app designation is not evidence of a completed population/data cutover.
  Last verified native admission was `phase: source`, generation 0 at
  `https://api.anacan.az/.well-known/anacan-backend.json`. Published native 30.0
  and the current iOS 39.0 candidate are source-first and use `refresh-before-use-v1`
  on their eventual Azure admission.
- Recheck live admission/evidence before claiming that mobile traffic, final data,
  source Auth writers or store releases have switched. Follow
  `docs/AZURE_FINAL_SYNC_AFTER_APPROVAL.md` for the remaining final-sync/release steps.
- Preserve `com.atlasoon.anacan`, team `8B6976J8H7`, the existing widget/App Group,
  WebView hostname `app.anacan.az`, session namespaces, logout tombstones and the
  one-way authority/adoption receipts.

## Working/build conventions

- Main app source is under `src/`; Azure gateway/runtime/ops are under
  `azure-migration/`. This tooling directory is ignored by Git; credential-free
  handoffs are generated with its reviewed archive scripts.
- Root `.env` and historical embedded native assets contain legacy configuration.
  For Azure web development use the explicit Azure mode/configuration; do not
  infer the intended deployment target from a default `vite build` alone.
- Native candidates use isolated workspaces through
  `azure-migration/scripts/prepare-native-preview.mjs` and `build-native-web.mjs`.
  Use `--ios-store` for the production-entitlement Xcode upload workspace.
- Preserve user work in the dirty worktree and Xcode-managed settings. The current
  iOS upload instructions are `docs/IOS_STORE_39.md`; older candidate history is
  `docs/IOS_RELEASE_31.md`. Published 30.0 artifacts
  are documented in `docs/XCODE_UPLOAD_30.md` and `docs/STORE_SUBMISSION_30.md`.
- Azure subprocesses use `azure-migration/scripts/azure-cli.mjs` to avoid GUI
  `spawn az ENOENT` caused by an incomplete PATH.
- Keep credentials, native signing material and private session snapshots out of
  logs/chat/Git/code archives. Use the existing private inputs and secret references.
