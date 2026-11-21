# Staging Firestore Security Rules Setup & Deployment Guide

> **Safety Boundary**: Production `firestore.rules` and `firebase-applet-config.json` (`ai-cv-builder-500906`) are **never** modified or deployed by this staging setup. Always deploy staging rules exclusively to a separate Firebase staging project.

## 1. Prerequisites

1. Create a separate staging project in the [Firebase Console](https://console.firebase.google.com/) (for example, `procvmaker-staging`), enable **Authentication -> Google Sign-In**, and provision a **Cloud Firestore** database.
2. Install the Firebase CLI (`firebase --version`) and authenticate (`firebase login`).
3. To run the local Firestore Emulator suite (`firebase emulators:exec`), install **Java JRE 17+** (`java -version`).

## 2. Files Used for Staging Only

| File | Purpose |
| --- | --- |
| `firestore.staging.rules` | Hardened rules enforcing `email_verified == true`, owner checks, strict field allowlists, type/size bounds, immutability on export history, and `createdAt` preservation |
| `firebase.staging.json` | Isolated Firebase CLI configuration pointing ONLY to `firestore.staging.rules` and emulator port `8080` |
| `security_spec.md` | Security invariants and adversarial test vector reference |
| `firebase-blueprint.json` | Updated schema reference aligned with actual client writes (`photoURL`, `aiGenerations`, bounded field constraints) |

## 3. Validate Locally Against the Firestore Emulator (Requires Java 17+)

If `@firebase/rules-unit-testing` is installed in an environment with Java JRE 17+:

```bash
# Run staging rules under Firebase Firestore Emulator
firebase emulators:exec --config firebase.staging.json --only firestore "npx vitest run tests/firestore.rules.test.ts"
```

> Note: Without Java JRE installed, the Firestore Emulator cannot start; `npm test` runs static structural checks on `firestore.staging.rules` and skips live emulator assertions cleanly when `FIRESTORE_EMULATOR_HOST` is not set.

## 4. Deploy Rules to Your Separate Staging Project

Replace `<YOUR_STAGING_PROJECT_ID>` with your separate staging Firebase project ID (never the production project ID):

```bash
# 1. Verify active project is NOT production before deploying
firebase projects:list

# 2. Deploy ONLY firestore rules using the staging config
firebase deploy --config firebase.staging.json --only firestore:rules --project <YOUR_STAGING_PROJECT_ID>
```

## 5. Manual Verification Checklist in Staging

After deploying `firestore.staging.rules` to staging, verify end-to-end with a test Google account:
1. Sign in with Google (`email_verified == true`) -> `syncUserProfile` merges `email`, `displayName`, `photoURL`, `lastLoginAt`.
2. Create initial CV -> adds doc under `/users/{uid}/cvs/{cvId}` and updates `activeCvId` on `/users/{uid}`.
3. Edit & autosave CV -> `updateCV` merges `data`, `design`, `title`, `updatedAt`.
4. Rename CV & duplicate CV -> `renameCV` and `duplicateCV` succeed.
5. Import Resume in `AIAssistantModal` -> appends entry to `aiGenerations`.
6. Update Display Name in `AccountSettingsModal` -> updates `displayName`.
7. Export PDF/PNG -> adds immutable snapshot to `/users/{uid}/history/{historyId}` and increments `downloadsCount`.
8. Delete snapshot in User Dashboard -> `deleteDoc` removes snapshot.
