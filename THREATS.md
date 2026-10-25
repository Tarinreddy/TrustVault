# TrustVault Security Threat Model & Risk Assessment
**Document:** `THREATS.md`  
**Version:** 1.0  
**Classification:** Security Architecture & Compliance  
**Last Updated:** 2026-10-23  

---

## 1. Threat Modeling Methodology

TrustVault employs a defense-in-depth threat analysis model focused on server-authoritative enforcement, zero-implicit-trust, and verifiable audit evidence. In accordance with the TrustVault Product Requirements Document (PRD Section 15), this document catalogues identified threat vectors, attack mechanics, server-side countermeasures, residual risks, and test mappings.

Each threat is assigned one of four formal dispositions:
- **Mitigated**: Risk is systematically eliminated or reduced to an acceptable operational baseline via technical controls.
- **Partially Mitigated**: Technical controls significantly reduce likelihood or impact; residual risk is constrained by monitoring or operational policy.
- **Accepted with Justification**: Risk is acknowledged and accepted because technical controls would conflict with core functionality or exceed defined scope.
- **Deferred**: Explicitly slated for future release iterations (e.g. V2 enterprise integrations).

---

## 2. Minimum Threat Catalog Matrix (PRD Section 15)

| # | Threat Scenario | Category | Disposition | Primary Countermeasure | Automated Test Mapping |
|---|---|---|---|---|---|
| 1 | Horizontal Privilege Escalation (Guessed Doc IDs) | Authorization | **Mitigated** | Server checks `ownerUid` & explicit active grant on every fetch | `FR-14.1`, `FR-14.2` |
| 2 | Vertical Privilege Escalation (Forged Admin Claims) | Identity | **Mitigated** | Roles loaded from server-controlled DB; client claims untrusted | `FR-14.5` |
| 3 | Direct Cloud Storage Access Bypassing Backend | Storage | **Mitigated** | Bucket private; Storage Rules deny direct read; delivery mediated | `FR-14.2` |
| 4 | Reuse of Previously Issued Download URLs | Storage/Access | **Mitigated** | No public or long-lived download URLs; ephemeral token streaming | `FR-14.6` |
| 5 | Access Using Disabled Accounts / Stale Tokens | Lifecycle | **Mitigated** | Real-time `account.status === 'active'` check on every request | `FR-14.7` |
| 6 | Access After Permission Revocation | Authorization | **Mitigated** | Authoritative grant status checked per request; immediate denial | `FR-14.6` |
| 7 | Unauthorized Permission Grants or Tampering | Permissions | **Mitigated** | Only authoritative `ownerUid` can execute grant/revoke operations | `FR-14.4` |
| 8 | Unauthorized Document Deletion or Replacement | Lifecycle | **Mitigated** | Strict ownership check; viewers/editors rejected from deleting | `FR-14.3` |
| 9 | Audit Event Modification, Insertion, or Deletion | Integrity | **Mitigated** | Append-only store; SHA-256 hash chaining; client write denied | `FR-14.10` |
| 10 | Partial Failures (Storage / Metadata / Audit Desync) | Reliability | **Partially Mitigated** | Fail-closed policy: failure to write audit aborts document delivery | `FR-14.10` |
| 11 | Malicious File Uploads & Extension Spoofing | Content Security | **Partially Mitigated** | Server MIME type validation, file signature check & size limit | `FR-03`, Unit Tests |
| 12 | Search & Metadata Enumeration | Information Leak | **Mitigated** | Server-side query filtering scoped strictly to discoverable docs | `FR-05`, `FR-14.1` |
| 13 | Repeated Denied Requests & Brute Force | Availability | **Partially Mitigated** | Audit logging of all denied attempts (`outcome: 'DENIED'`) + rate limits | `FR-14.10` |
| 14 | Abuse of Privileged Cloud Functions / Service Keys | Privilege | **Mitigated** | Cloud Functions enforce role checks independently of Admin SDK | `FR-14.5`, `FR-14.8` |
| 15 | Cross-Site Scripting (XSS) via Filenames & Metadata | Injection | **Mitigated** | React JSX auto-escaping, strict input sanitization & CSP | Unit Tests |
| 16 | Leakage Through Error Messages, Caches, or Browser | Information Leak | **Mitigated** | Sanitized error codes (`UNAUTHORIZED_ACCESS`); `no-store` headers | Integration Tests |
| 17 | Concurrent Permission Changes & Active Downloads | Concurrency | **Mitigated** | Immediate grant status mutation; short-lived download authorization | `FR-14.6` |
| 18 | Excessive Administrative Privileges | Confidentiality | **Mitigated** | Admin role does NOT bypass document confidentiality by default | `FR-14.8` |
| 19 | Denial of Service & Storage/Function Cost Exploits | Availability | **Partially Mitigated** | File upload size limits (e.g. 50MB), quotas, and unauthenticated block | Unit Tests |
| 20 | Data Retention, Backups, and Permanent Deletion | Lifecycle | **Partially Mitigated** | Soft-delete / quarantine mechanism before permanent purge | `FR-10` |

---

## 3. Deep-Dive Threat Analysis

### Threat 1: Horizontal Privilege Escalation through Guessed Document IDs
- **Attack Vector**: An attacker guesses or enumerates a UUID/document ID (e.g., `doc_financial_q4`) and sends a direct `GET /documents/{id}` request.
- **Impact**: Unauthorized access to proprietary corporate documents across different users.
- **Countermeasure**: The server never assumes possession of a document ID equals authorization. On every document request, `AuthorizationEngine.authorizeRead(user, doc, grants)` executes. Access is denied unless the actor is the recorded `ownerUid` or possesses an `active` grant.
- **Residual Risk**: Information timing side-channels; mitigated by returning consistent response latencies and uniform denial payloads.
- **Verification**: Covered by automated test `FR-14.1`.

### Threat 5: Access Using Disabled Accounts or Stale Tokens
- **Attack Vector**: An employee is terminated, but their Firebase JWT ID token remains valid until the 1-hour expiration. The employee attempts to download confidential files.
- **Impact**: Exfiltration of intellectual property by ex-employees.
- **Countermeasure**: TrustVault enforces a real-time account status check (`user.status === 'active'`) on the server database on every protected transaction. Even if the JWT token is cryptographically valid, the operation is rejected immediately with reason code `ACCOUNT_DISABLED`.
- **Residual Risk**: None for server-mediated operations. Downloaded files prior to termination cannot be remotely recalled.
- **Verification**: Covered by automated test `FR-14.7`.

### Threat 6: Access After Permission Revocation
- **Attack Vector**: A document owner revokes Alice's access, but Alice attempts to reuse an earlier session or cached request.
- **Impact**: Persistent document access contrary to owner intent.
- **Countermeasure**: Permission grants maintain authoritative status (`'active' | 'revoked'`). When an owner revokes access, the grant status is permanently set to `revoked` and logged to the audit chain. Subsequent read attempts are denied with `PERMISSION_REVOKED`.
- **Verification**: Covered by automated test `FR-14.6`.

### Threat 9: Audit Event Modification or Deletion
- **Attack Vector**: An insider or compromised credential modifies audit records in the database to conceal illicit access.
- **Impact**: Loss of non-repudiation and compromised forensic evidence.
- **Countermeasure**:
  1. Firestore Security Rules deny all direct client write/update/delete operations on the `auditEvents` collection.
  2. Cryptographic SHA-256 hash chaining: Each event incorporates the SHA-256 digest of the previous event. Altering any field invalidates the entire subsequent hash chain.
  3. Automated integrity verification algorithm checks the chain and identifies the exact index and nature of any corruption.
- **Residual Risk**: A database superuser could theoretically rewrite the entire chain and recompute hashes. Mitigated by exporting periodic hash checkpoints to write-once storage (WORM).
- **Verification**: Covered by automated test `FR-14.10`.

### Threat 18: Excessive Administrative Privileges
- **Attack Vector**: An IT administrator abuses their provisioning role to inspect executive payroll or merger documents without authorization.
- **Impact**: Breach of executive confidentiality.
- **Countermeasure**: Per PRD Section 6.1, administrative status governs identity and audit oversight, but does *not* confer blanket document read privileges. Unless explicitly granted access by the owner, an administrator attempting to read a private document receives an `ADMIN_CONTENT_RESTRICTED` denial.
- **Verification**: Covered by automated test `FR-14.8`.

---

## 3.1 PRD Extension 03: Settings & Preferences Threats (Threats 26–30)

### Threat 26: Self-Role Elevation via Settings Parameter Injection
- **Attack Vector**: A viewer or owner submits a `userPreferences` update containing injected keys such as `role: 'admin'`, `status: 'active'`, or `permissions: 'all'`.
- **Impact**: Vertical privilege escalation to full platform administrator.
- **Countermeasure**: `SettingsService.updateUserPreferences` explicitly checks incoming payload keys against an immutable list of forbidden identity attributes (`role`, `status`, `uid`, etc.). Any attempt immediately fails closed with `ROLE_ESCALATION_BLOCKED` and is permanently recorded in the cryptographic audit chain.
- **Verification**: Verified in `src/tests/settings.test.ts` (TEST 2, TEST 3, TEST 5).

### Threat 27: Cross-User Preference Tampering (IDOR on userPreferences)
- **Attack Vector**: User Bob (`user_bob`) submits an update targeting Alice's preference document (`targetUid: 'user_alice'`).
- **Impact**: Unauthorized modification of another user's display name, notifications, or workflow defaults.
- **Countermeasure**: `SettingsService` strictly verifies `actor.uid === targetUid`. Any mismatch aborts with `UNAUTHORIZED_CROSS_USER`.
- **Verification**: Verified in `src/tests/settings.test.ts` (TEST 4).

### Threat 28: Administrative Security Control Downgrade / Policy Weakening
- **Attack Vector**: A compromised administrator attempts to disable audit retention (`auditRetentionDays: 0`) or permit unbounded file uploads (> 500MB) via platform settings.
- **Impact**: Forensic log erasure, denial of service, or storage quota exhaustion.
- **Countermeasure**: Hard server-enforced lower and upper bounds. `retentionPolicy.auditRetentionDays` enforces a mandatory minimum of 30 days (compliance minimum; default 2555 days / 7 years); values below this threshold are rejected with `MANDATORY_AUDIT_RETENTION_VIOLATION`. Atomic rollback prevents partial mutations.
- **Verification**: Verified in `src/tests/settings.test.ts` (TEST 9, TEST 10).

### Threat 29: Audit Suppression via Notification Preference Manipulation
- **Attack Vector**: A malicious user unchecks all notification channels (in-app, email, WhatsApp, security alerts) hoping to operate stealthily without audit detection.
- **Impact**: Undetected document access or tampering.
- **Countermeasure**: Notification delivery preferences govern message routing channels only. Cryptographic SHA-256 audit ledger logging is decoupled and immutable, capturing all actions regardless of client alert toggles.
- **Verification**: Verified in `src/tests/settings.test.ts` (TEST 6).

### Threat 30: Unverified Authentication Method Switching
- **Attack Vector**: An attacker attempts to set their preferred OTP delivery channel to WhatsApp without possessing a verified phone number or entering a valid confirmation code.
- **Impact**: Account takeover or OTP misdirection.
- **Countermeasure**: `SettingsService.verifyAndChangeOtpMethod` requires a pre-existing verified mobile number and enforces code confirmation before activating WhatsApp OTP delivery.
- **Verification**: Verified in `src/tests/settings.test.ts` (TEST 8).

### Threat 32: Direct Database Access Bypassing Backend Application (PostgreSQL RLS Bypass)
- **Attack Vector**: An attacker uses the public Supabase anon key to make direct REST or GraphQL requests against `public.profiles`, `public.documents`, or `public.audit_events` hoping to read unauthorized documents or elevate their account role to administrator.
- **Impact**: Mass data exfiltration, horizontal cross-tenant access, or unauthorized privilege escalation.
- **Countermeasure**: PostgreSQL Row Level Security (RLS) is enabled and enforced on all 10 application tables. Database policies (`documents_grantee_select`, `grants_owner_manage`, `messages_visibility_policy`, `profiles_update_own`) enforce least-privilege row access directly inside the database engine. Trigger `trg_check_profile_escalation` strictly rejects unauthorized modifications to `role` or `status` attributes.
- **Verification**: Verified in `src/tests/supabaseBackend.test.ts` (SUPA-02, SUPA-05).

### Threat 33: Stale Signed Storage URLs Bypassing Permission Revocation
- **Attack Vector**: An attacker attempts to reuse previously issued signed storage URLs after a document owner has explicitly revoked their permission grant.
- **Impact**: Data leakage occurring after access authorization has been terminated.
- **Countermeasure**: The `vault-documents` Supabase Storage bucket is strictly private (`public: false`). The application never generates long-lived storage URLs. Every download request executes real-time authoritative database grant verification (`AuthorizationEngine.authorizeRead`) before delivering ephemeral 60-second signed URLs or raw encrypted object blobs. Revoked grants immediately fail closed with `PERMISSION_REVOKED`.
- **Verification**: Verified in `src/tests/supabaseBackend.test.ts` (SUPA-03, SUPA-04).

---

## 4. Threat Model Maintenance
This document is a living security artifact. It must be re-evaluated whenever new endpoints, authentication mechanisms, or storage backends are introduced.


