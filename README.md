# Tern

Early-career recruitment platform. Monorepo, npm workspaces.

## Apps

- `apps/marketing` — pre-launch waitlist site (Next.js). Live app roadmap in the planning doc: `apps/admin` (verification/moderation dashboard) and `apps/mobile` (Expo, job seekers + employers) follow per the phased roadmap.

## Local development

```bash
npm install
npm run dev:marketing
```

Requires `apps/marketing/.env.local` with Firebase Admin credentials — copy `apps/marketing/.env.example` and fill in values from Firebase console → Project settings → Service accounts → Generate new private key.

## Firebase

Project: `tern-je` (Firestore, `europe-west2`).

- Security rules live at `firestore.rules` (repo root) and deploy with `firebase deploy --only firestore:rules --project tern-je`.
- The `waitlist` collection is server-write-only via the Admin SDK; no client path reads or writes it directly.

## Deploying `apps/marketing` to Vercel

1. Connect this repo in the Vercel dashboard.
2. Set the project's **Root Directory** to `apps/marketing` (Vercel builds a single app per project; this repo is a monorepo).
3. Framework preset: Next.js (auto-detected).
4. Add environment variables (Project Settings → Environment Variables), for **Production**, **Preview**, and **Development**:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` — paste exactly as it appears in `.env.local`, including the surrounding quotes and `\n` sequences.
5. Deploy. Every push to a branch other than the production branch becomes a Preview deployment automatically.
