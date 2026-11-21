# Firestore Security Specification (Staging Target)

> Scope: Applies to staging Firestore rules (`firestore.staging.rules`) targeting a separate Firebase staging project (`firebase.staging.json`). Production `firestore.rules` and live Firebase configuration remain unmodified.

## 1. Access Control Matrix & Structural Invariants

| Path | `get` | `list` | `create` | `update` | `delete` | Core Invariants |
| --- | --- | --- | --- | --- | --- | --- |
| `/users/{userId}` | Owner (`email_verified == true`) | Deny (`false`) | Owner + `isValidUserFields` | Owner + `isValidUserFields` | Deny (`false`) | Keys restricted to `['email', 'displayName', 'photoURL', 'createdAt', 'lastLoginAt', 'activeCvId', 'downloadsCount', 'aiGenerations']`. Supports partial `{ merge: true }` upserts used by `syncUserProfile`, `createCV` (`activeCvId`), `recordExport` (`downloadsCount`), `AccountSettingsModal` (`displayName`), and `AIAssistantModal` (`aiGenerations`). If `email` is non-empty, it must match `request.auth.token.email`. |
| `/users/{userId}/cvs/{cvId}` | Owner (`email_verified == true`) | Owner (`email_verified == true`) | Owner + `isValidCVCreate` | Owner + `isValidCVUpdate` | Owner (`email_verified == true`) | Keys restricted to `['title', 'data', 'design', 'createdAt', 'updatedAt', 'isDefault']` with required `['title', 'data', 'design']`. `title` is 1..200 chars; `data` is map (`<= 20` top-level keys); `design` is map (`<= 25` keys); `createdAt` cannot be overwritten once set. Compatible with both Firestore `Timestamp` and legacy ISO strings. |
| `/users/{userId}/history/{historyId}` | Owner (`email_verified == true`) | Owner (`email_verified == true`) | Owner + `isValidHistoryCreate` | Deny (`false`) | Owner (`email_verified == true`) | Export snapshots are immutable once created (`allow update: if false`). Keys restricted to `['timestamp', 'format', 'fileName', 'cvData', 'designConfig']`. `format` must be `'pdf'` or `'png'`. |
| `/{document=**}` (all other paths) | Deny (`false`) | Deny (`false`) | Deny (`false`) | Deny (`false`) | Deny (`false`) | Default deny catch-all. |

## 2. Adversarial "Dirty Dozen" Test Scenarios

All negative security vectors that `firestore.staging.rules` must reject (`PERMISSION_DENIED`):

1. **Unauthenticated read/write** on `/users/alice` or `/users/alice/cvs/cv1`.
2. **Unverified email token** (`email_verified: false`) attempting read or write on own `/users/alice` path.
3. **Cross-user read or list** (`bob` reading `/users/alice` or listing `/users` collection or `/users/alice/cvs`).
4. **Cross-user create/update/delete** (`bob` modifying `/users/alice/cvs/cv1` or `/users/alice/history/h1`).
5. **Account scraping (`list /users`)** by an authenticated verified user.
6. **Account deletion (`delete /users/alice`)** via client SDK (must be denied).
7. **Shadow / ghost fields injection** (e.g., writing `{ role: "admin", isAdmin: true, plan: "enterprise" }` on `/users/alice` or `/users/alice/cvs/cv1`).
8. **Email spoofing** in `/users/alice` (`email: "victim@example.com"` mismatched against `request.auth.token.email`).
9. **Type confusion / invalid enum** on `/users/alice/history/h1` (`format: "exe"` or `downloadsCount: "999"` or negative `downloadsCount: -5`).
10. **Denial-of-Wallet oversized payloads** (`title` > 200 chars, `userId`/`cvId` > 128 chars, `aiGenerations` list > 200 entries, `data` map > 20 keys).
11. **Immutability bypass** attempting `update` on `/users/alice/history/h1` or overwriting `createdAt` on `/users/alice/cvs/cv1`.
12. **Unknown collection write** attempting writes to `/admin/config`, `/public/telemetry`, or `/users/alice/unknownSub/doc1`.
