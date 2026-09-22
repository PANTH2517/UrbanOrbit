# UrbanOrbit

A crowd-sourced civic issue reporting platform: citizens report urban problems
on an interactive map, verified government officials triage and resolve them.

Originally built on Base44, now running entirely on infrastructure the
project owner controls directly: Firebase (Auth, Firestore) on the free
Spark plan, Cloudinary (free tier) for file storage, plus a small Vercel
serverless API and a local admin script for the things that need
server-side secrets/privileges — **no billing account required anywhere**.
See [`docs/SECURITY.md`](docs/SECURITY.md) for the full architecture and
security model, and [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md) /
[`docs/TERMS_OF_SERVICE.md`](docs/TERMS_OF_SERVICE.md) for the policy
documents.

## Stack

- Frontend: React 19 + Vite + Tailwind CSS + react-leaflet, deployed to
  Vercel.
- Data: Firebase (Auth, Firestore) - Spark (free) plan is enough.
- Files: Cloudinary (free tier), not Firebase Storage - new Firebase Storage
  buckets now require the Blaze billing plan even on a fresh project.
- AI proxy: `api/generateRecommendation.js`, a Vercel serverless function that
  holds the Gemini API key server-side.
- Admin document access: `api/getDocumentUrl.js`, a Vercel serverless
  function that mints a signed Cloudinary URL only for admins.
- Admin actions (granting the `government_official`/`admin` role): run
  locally via `scripts/admin-cli.js`, using the Firebase Admin SDK with a
  downloaded service-account key - not a hosted function, so no billing
  account is needed.

## First-time project setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Firebase project**: this repo is wired to the `urbanorbit-5b633`
   Firebase project (`.firebaserc`). If you're standing this up under your
   own project, update `.firebaserc` and create the equivalent apps/services
   in the Firebase console (Authentication, Firestore - Spark/free plan).

3. **Environment variables**: copy `.env.example` to `.env` and fill in the
   web app config from Firebase console → Project settings → General → Your
   apps. Never commit `.env`.

4. **Cloudinary account** (free, no card required):
   [cloudinary.com/users/register/free](https://cloudinary.com/users/register/free).
   - Dashboard home page shows your **Cloud name**, **API Key**, and
     **API Secret** - put these in `.env` (`VITE_CLOUDINARY_CLOUD_NAME`,
     `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
   - Settings → Upload → Upload presets → **Add upload preset**, create two,
     both **Signing Mode: Unsigned**:
     - `urbanorbit_public` - default Access Mode (public) - issue photos.
     - `urbanorbit_private` - Access Mode: **Authenticated** - official
       verification documents.
   - If PDF uploads fail: Settings → Security → check whether "PDF and ZIP
     files" delivery is restricted, and allow it (recent Cloudinary accounts
     restrict this by default).

5. **Service account key** (for `scripts/admin-cli.js` and the two `api/*.js`
   functions): Firebase console → Project settings → Service accounts →
   **Generate new private key**. Save the downloaded file as
   `serviceAccountKey.json` in the project root - it's already gitignored,
   never commit it. For `api/*.js` (which run on Vercel, not locally), also
   set its full JSON contents as one line in the `FIREBASE_SERVICE_ACCOUNT`
   env var (locally in `.env`, and in the Vercel project settings for the
   real deployment).

6. **Deploy Firestore rules** (requires `firebase login` first, run
   interactively in your own terminal - not through an automated/non-TTY
   shell, since it needs a browser popup):
   ```
   firebase login
   firebase deploy --only firestore:rules
   ```

7. **Bootstrap the first admin**: set `VITE_SUPER_ADMIN_EMAIL` (locally in
   `.env`, and in Vercel project settings for the real deployment) to the
   email that should see the one-time setup hint. Sign in through
   `/GovernmentLogin` with that email, then on `/GovernmentRegister` copy
   and run the `seed-admin` command it shows you. After that, all further
   officials are reviewed at `/AdminApprovals` (which gives you
   copy-pasteable `admin-cli.js approve/reject` commands per application).

8. **AI recommendations** (optional): create a Gemini API key at
   [Google AI Studio](https://aistudio.google.com/apikey) and put it in
   `GEMINI_API_KEY` (locally in `.env`, and in Vercel project settings for
   the real deployment).

## Local development

```
npm run dev
```

To exercise `/api/*.js` locally too (AI recommendations, admin document
viewing), use the Vercel CLI instead of plain `vite`:
```
npx vercel dev
```

To test Firestore rules locally before deploying:
```
firebase emulators:start
```

## Build

```
npm run build
```

## Project layout

- `src/Pages/` - route-level pages (citizen map, government dashboard, auth,
  admin approvals, ...)
- `src/Components/` - shared UI primitives (`ui/`), auth flows (`auth/`), and
  feature components (`citizen/`, `government/`, `map/`, `problems/`)
- `src/entities/` - thin Firestore data-access wrappers (`Issue`,
  `OfficialApplication`, `User`)
- `integrations/Core.jsx` - file upload (Cloudinary) and AI recommendation
  (calls `api/generateRecommendation.js`) helpers
- `api/` - server-side logic that needs a secret key (AI proxy, admin
  document URLs), deployed as Vercel serverless functions
- `scripts/admin-cli.js` - local admin actions (approve/reject officials,
  seed the first admin) - see the comment at the top of that file for setup
- `firestore.rules` - the actual access-control enforcement for app data
- `docs/` - security, privacy, and terms documentation
