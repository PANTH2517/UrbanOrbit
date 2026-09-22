# UrbanOrbit — Security & Architecture Overview

This document is written for whoever reviews this app before it's approved for
use by a municipal body, or before a security audit. It describes what the
system actually does, not what it aspires to do.

## 1. Backend

UrbanOrbit's backend is a Firebase project (`urbanorbit-5b633`) the developer
owns directly, plus a small serverless API on Vercel — this fully replaces
the original Base44 managed backend. Deliberately, none of this requires any
billing account (Firebase Blaze, or otherwise):

- **Cloud Firestore** (Spark/free plan) — the primary database (`issues`,
  `users`, `officialApplications`, `auditLog` collections).
- **Firebase Authentication** (Spark/free plan) — plain email/password
  accounts for both citizens and government officials (see §3 for the
  identity-verification tradeoff this makes for citizens specifically).
- **Cloudinary** (free tier, not Firebase Storage) — issue photos and
  official-application documents. As of late 2024, new Firebase Storage
  buckets require the Blaze billing plan even on an otherwise-free project,
  so file storage lives on Cloudinary instead. Issue photos upload through an
  unsigned "public" preset (matches their public-transparency design);
  official documents upload through an unsigned preset configured for
  Cloudinary's "authenticated" delivery type, so the resulting file isn't
  reachable by a guessed/leaked URL - only `api/getDocumentUrl.js` can mint a
  working (signed) link, and only for a caller with the `admin` role.
- **A Vercel serverless function** (`api/generateRecommendation.js`) — the
  only place the AI provider's secret key lives; it verifies the caller's
  Firebase ID token and role before calling Gemini. This replaces what would
  otherwise be a Firebase Cloud Function, specifically so the project doesn't
  need Blaze billing just to make one AI call.
- **A local admin CLI** (`scripts/admin-cli.js`) — the only place role grants
  (`government_official`/`admin`) happen. Run by a human admin on their own
  machine with a downloaded service-account key, using the Firebase Admin
  SDK directly (same trust model as a Cloud Function - the Admin SDK bypasses
  Security Rules either way - just without needing a hosted function or
  billing account).

No secret key (AI provider key, Cloudinary API secret, service-account
credentials) is ever present in the browser bundle. The Firebase Web SDK
config (`VITE_FIREBASE_*` in `.env`) is not a secret by Firebase's own
design — access is controlled by Firestore Security Rules and Firebase
Authentication, not by hiding the config. It should still be restricted to
this app's domain via an HTTP referrer restriction in Google Cloud Console →
Credentials.

If/when this project does get a Blaze-enabled Firebase project (e.g. once
formally adopted by a municipal body), the admin-CLI actions and the AI proxy
can both move into real Cloud Functions with no change to the security model
— only the hosting location of the same Admin-SDK logic changes.

## 2. Authentication & roles

There are three roles, all derived from **Firebase custom claims** (a signed
value inside the user's ID token that the client cannot set itself — only the
Admin SDK, running in a Cloud Function, can set it):

| Role | How it's granted |
|---|---|
| `citizen` (default, no claim) | Sign up with email + password |
| `government_official` | Admin runs `node scripts/admin-cli.js approve <uid>` after reviewing a submitted application |
| `admin` | The designated first admin (a hardcoded email in `scripts/admin-cli.js`) runs `seed-admin`; further admins are promoted the same way by an existing admin |

Every route that should be official/admin-only is wrapped in
`ProtectedRoute` (`src/Components/auth/ProtectedRoute.jsx`), which reads the
role from the live ID token — never from anything stored client-side like
`localStorage`.

## 3. Citizen identity verification — what's implemented, and what isn't

Citizen sign-in is plain Firebase Auth email + password
(`src/Pages/CitizenAuth.jsx`: a Login tab and a Register tab), with
"Forgot password" via Firebase's own built-in `sendPasswordResetEmail` —
Firebase sends that email itself, no custom mail infrastructure needed.

**This project tried three progressively simpler approaches before landing
here**, each abandoned for a concrete reason rather than by choice, worth
recording so the tradeoff is understood rather than assumed:

1. **Firebase Phone Auth (SMS OTP)** — the original design. Blocked outright:
   sending real SMS requires the Blaze pay-as-you-go billing plan
   (`auth/billing-not-enabled`), which this project avoids everywhere else.
2. **2Factor.in (SMS OTP via a third-party API)** — worked in principle, but
   its default route sent a *voice call* rather than a text on the
   maintainer's number (common when a number is DND-registered in India,
   which blocks generic transactional SMS), and a real fix needed a
   DLT-approved template requiring business paperwork.
3. **Email OTP via Gmail SMTP** (a custom 6-digit code, `contact_verified`
   custom claim) — genuinely free and worked end-to-end, but the maintainer
   decided the added infrastructure (Gmail App Passwords, a dedicated
   sending account) and failure modes (two App Passwords rejected by Gmail
   before one worked) weren't worth it for this project's needs versus
   plain email/password.

**What this means in practice**: any account with a real email/password
carries the same privileges — there is currently no step that confirms a
citizen can be reached at a real phone number or a real inbox. This is a
**meaningfully weaker anti-bot/anti-throwaway-account signal** than any of
the three approaches above; it's a deliberate simplicity-over-verification
tradeoff by the project owner, not an oversight. `firestore.rules`'
`isCanContribute()` reflects this honestly (`isSignedIn()`, full stop). If
stronger identity assurance is needed later — before a real municipal
launch, say — reintroducing an OTP step is a contained change: add a claim,
check it in `isCanContribute()`, gate `CitizenAuth.jsx`'s post-auth
redirect on it, same shape as approach 3 above (still in git history if
useful as a reference).

**What this is not, regardless of which of the above is active**:
Aadhaar/UIDAI eKYC. Verifying against India's Aadhaar system requires the
operating entity to be a licensed AUA/KUA (Authentication User Agency / KYC
User Agency) registered with UIDAI — a business and legal registration
process, not something achievable purely in application code.

## 4. Government official verification — what's implemented, and what isn't

There is no public API to check "is this person really a municipal
official." Instead:

1. An official signs in/up at `/GovernmentLogin`.
2. If they don't yet have the `government_official` claim, they're routed to
   `/GovernmentRegister` to submit name, department, employee ID, phone
   number, and an authorization document (ID card, appointment letter, etc.)
   uploaded to Cloudinary as a private/authenticated asset (see §1).
3. A human admin reviews the application and the document at
   `/AdminApprovals` and clicks Approve or Reject there directly - this
   calls `api/reviewApplication.js` (a Vercel serverless function, same
   trust model as `scripts/admin-cli.js`: it verifies the caller's ID token
   carries the `admin` role, then uses the Admin SDK to set the
   `government_official` custom claim). The CLI commands
   (`scripts/admin-cli.js approve/reject <uid>`) still work identically as a
   fallback - useful if you're not near this deployment - and are available
   behind a "CLI alternative" toggle on each pending application.
4. Every approval/rejection/revocation is written to the `auditLog`
   collection by the Admin SDK itself (never by the client, regardless of
   which of the two paths above triggered it), and is visible in the Admin
   Approvals audit log view.

The one admin account itself signs in at `/AdminLogin` - a second entry
point, deliberately not linked from `/RoleSelection` or `/GovernmentLogin`,
that only signs in (it never creates an account on a failed attempt, unlike
`/GovernmentLogin`) and immediately signs back out if the account it just
verified doesn't already carry the `admin` claim. `scripts/admin-cli.js
seed-admin <email>` is still the only thing that ever grants that claim in
the first place.

This is a manual-review model, appropriate for a pilot/launch. If UrbanOrbit
is formally adopted by a municipal body, the more defensible long-term model
is: the municipality provisions accounts directly (e.g. via SSO with their
existing directory), rather than self-service application + manual review.

## 5. Access control (Firestore Security Rules + the document-URL function)

See `firestore.rules` for the enforced logic (this is server-side and cannot
be bypassed by a modified client):

- `issues` — publicly readable (this is a transparency tool); citizens/
  officials can create their own report but cannot edit it afterward; only
  officials/admins can change `status`/`priority`/`assigned_to`.
- `officialApplications/{uid}` — the applicant can create/read their own
  application; **no client, including an admin's own browser session, can
  change its status** — only `scripts/admin-cli.js` (Admin SDK) can, which
  keeps every approval on the audit trail.
- `auditLog` — admin-readable, write-only via the Admin SDK.
- Official documents on Cloudinary aren't governed by Firestore rules at all
  (Cloudinary has no equivalent concept) — access control is instead that the
  asset is uploaded as "authenticated" delivery type, so no URL works without
  a Cloudinary-signed signature, and `api/getDocumentUrl.js` only produces
  that signature for a caller whose Firebase ID token carries the `admin`
  role.

## 6. Production hardening (App Check, rate limiting, monitoring)

- **Firebase App Check** (`src/firebase.jsx`) is wired up behind
  `VITE_RECAPTCHA_SITE_KEY` — register this web app in Firebase console →
  App Check with a reCAPTCHA v3 site key and set that env var to start
  rejecting Firestore/Auth traffic that didn't come from the real app.
  Optional in local dev (falls back to no App Check if unset).
- **Per-caller rate limiting** on both Vercel functions
  (`api/_lib/rateLimit.js`), backed by a Firestore fixed-window counter
  (`_rateLimits/{action}_{uid}_{window}`, Admin-SDK-only — not reachable by
  any client per `firestore.rules`' default-deny): 60 Gemini calls/minute
  per official on `generateRecommendation.js` (covers both interactive use
  and GovernmentReports.jsx's bulk CSV/PDF export), 20 document-link
  mints/minute per admin on `getDocumentUrl.js`, 30 approve/reject/revoke
  calls/minute per admin on `reviewApplication.js`. This is a floor against
  a leaked/compromised token being used to burn through the Gemini quota,
  scrape every applicant's document, or spam the audit log, not a
  substitute for App Check.
- **Optional error monitoring** (`src/monitoring.js`) — set `VITE_SENTRY_DSN`
  (a free Sentry project) to start receiving real crash reports from
  `ErrorBoundary`. Entirely inert with no env var set; nothing else depends
  on it.
- **Route-level code splitting** (`src/app.jsx`, `React.lazy`/`Suspense`) —
  each page's own dependencies (react-leaflet, recharts) only download when
  a user visits that page, instead of every visitor downloading the whole
  app upfront. Firebase is further split into its own long-lived cache chunk
  (`vite.config.js` `manualChunks`) since it changes far less often than
  application code.

## 7. Known limitations / explicitly out of scope for this pass

- No formal penetration test has been performed.
- No dedicated WAF - abuse protection is App Check + the per-caller rate
  limits in §6 + Firestore's own quotas.
- Signed Cloudinary document URLs from `api/getDocumentUrl.js` expire after
  5 minutes **only if** `CLOUDINARY_AUTH_TOKEN_KEY` is set, which requires
  enabling "Strict token-based authentication" in the Cloudinary console
  (Settings → Security) — an account-level toggle, not something achievable
  from code alone. Without it, the signature just can't be forged without
  the API secret, but doesn't expire on its own. Acceptable for a small
  admin pool; revisit if that pool grows.
- Aadhaar/government-ID eKYC (see §3).
- SSO/directory integration for officials (see §4).
- Full accessibility (WCAG) audit.
- Map tiles default to OpenStreetMap's free public tile server
  (`tile.openstreetmap.org`), which has a light-use policy not meant for
  real production traffic at scale. `src/Components/map/MapContainer.jsx`
  reads the tile URL/attribution from `VITE_MAP_TILE_URL`/
  `VITE_MAP_TILE_ATTRIBUTION` (see `.env.example`), so switching to a paid
  provider (MapTiler, Stadia Maps, Mapbox) before a real launch is a config
  change, not a code change.
- The "Heat Islands" and "Green Spaces" map views (`ThermalHeatMap.jsx`) show
  **real public satellite data** from NASA GIBS (MODIS/Terra Land Surface
  Temperature and NDVI vegetation index) as a proxy for those categories.
  This is genuine remote-sensing data, not a trained AI segmentation model —
  a real slum/heat-island/green-cover classifier (e.g. a UNet segmentation
  model trained on Sentinel-2 imagery, as pitched in the SIH submission)
  would be a substantial standalone ML project and is explicitly out of
  scope for this pass.
- The app currently targets a single hardcoded city (`src/config/cities.js`,
  `DEFAULT_CITY_ID`). The shape of that file is intentionally
  city-agnostic (a `CITIES` map keyed by city id) so a future city
  switcher/URL param just needs to add entries and change which one is
  active, rather than hunting down hardcoded coordinates and copy again.

## 8. Reporting a vulnerability

Contact the project maintainer directly rather than filing a public issue for
anything that looks like a security vulnerability.
