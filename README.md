# TrustVault — Secure Document Sharing Platform

[![Security & Backend Tests](https://img.shields.io/badge/Security_Tests-53%2F53_Passing-brightgreen)](#automated-security-testing)
[![PRD Compliance](https://img.shields.io/badge/PRD_Specification-v1.0%2C_Ext_01%2C_Ext_02%2C_Ext_03_%26_Ext_04-blue)](#functional-requirements-coverage)
[![Architecture](https://img.shields.io/badge/Stack-React_%7C_TypeScript_%7C_Vite_%7C_Supabase_%7C_PostgreSQL_%7C_RLS_%7C_Storage-informational)](#technical-architecture)

> **TrustVault** is a security-first, enterprise-grade document sharing and custody platform designed to ensure confidential documents are accessible **only to explicitly authorized individuals** with verifiable, tamper-evident cryptographic audit evidence.

---

## 1. Core Principles

1. **Explicit Server-Side Authorization:** Every document retrieval, edit, deletion, or permission grant is evaluated on the server. Possession of a document ID or storage path confers zero access.
2. **Accountability & Tamper-Evident Audit:** Successful operations and denied attempts are committed to an immutable append-only ledger linked by a **SHA-256 cryptographic hash chain**.
3. **Immediate Revocation & Deactivation:** Revoking a grant or deactivating an account immediately denies all subsequent protected requests on the server.
4. **Administrative Confidentiality Boundary:** Administrative status governs identity and compliance oversight, but does *not* automatically grant access to view confidential document contents.
5. **No Public Registration:** Self-registration is strictly disabled. Only authenticated administrators can provision corporate accounts.
6. **Role Selection Is Not Authorization (PRD 28.2):** Selecting an entry portal only specifies the intended sign-in route. The backend strictly validates the authoritative role and rejects mismatched attempts (`ROLE_MISMATCH`).
7. **Role-Based Support Hierarchy (PRD 40):** Support requests follow a strict hierarchy (**Viewer → Document Owner → Administrator**). Viewers cannot bypass owners or escalate directly to admins; internal notes are never disclosed to requesters.
8. **Role-Scoped Settings & Preferences (PRD 58–66):** Users can manage permitted personal preferences according to their assigned role. Self-role elevation, parameter injection, cross-user tampering, and audit log suppression are strictly prevented.

---

## 2. Pre-Configured Test Accounts (Evaluator Guide)

TrustVault includes registered test personas with registered emails and phones for passwordless OTP verification:

| Persona | Name | Role | Email | Phone (WhatsApp) | Account Status | Intended Verification Purpose |
|---|---|---|---|---|---|---|
| 👑 **Administrator** | Sarah Chen | `admin` | `admin@trustvault.security` | `+1 555-019-2831` | `active` | User provisioning, lifecycle deactivation, platform security/storage/retention policies, support queue oversight, full analytics. Content restricted on unshared docs (`ADMIN_CONTENT_RESTRICTED`). |
| 🛡️ **Document Owner** | Alice Vance | `owner` | `alice.vance@trustvault.security` | `+1 555-014-9842` | `active` | Uploads confidential documents, grants read/edit permissions to colleagues, revokes access, responds to viewer support tickets, configures document & workflow defaults. |
| 👤 **Viewer / Contributor** | Bob Miller | `viewer` | `bob.miller@trustvault.security` | `+1 555-018-3419` | `active` | Has explicit Read permission on MSA contract, Edit permission on HSM architecture, creates tickets for authorized documents, manages personal profile, auth methods, and appearance. |
| 🚫 **Deactivated Employee** | Eve Thorne | `viewer` | `eve.thorne@trustvault.security` | `+1 555-010-4491` | `disabled` | Terminated ex-employee account. **All operations and login attempts are systematically rejected** by the server with `ACCOUNT_DISABLED`. |

---

## 3. PRD Extension 01: Website, Authentication & Analytics

### 3.1 Public Enterprise Homepage (PRD Section 27)
- **Public Entry Point:** Accessible without authentication at root.
- **Enterprise Storytelling:** Communicates core principles (Explicit Access Control, Controlled Revocation, Verifiable Audit Evidence).
- **How It Works Diagram:** Six-stage horizontal workflow separating identity verification from document-level authorization.
- **Header Navigation:** Product Overview, Security Principles, Audit & Compliance, How It Works, and Sign In action.
- **Zero Public Registration:** No self-signup or trial registration exists.

### 3.2 Role-Based Authentication Portals (PRD Section 28)
- Dedicated entry cards for **Administrator Access**, **Document Owner Access**, and **Viewer Access**.
- **Role Mismatch Enforcement:** If a Viewer attempts entry through the Administrator portal, the server rejects authentication with `ROLE_MISMATCH`.

### 3.3 Passwordless OTP Authentication (PRD Section 29)
- **Options:** Email OTP and WhatsApp OTP with 5-minute expiry countdown, 30s resend cooldown, single-use security, and max 3 attempts.

### 3.4 Data-Rich Role Dashboards with Recharts (PRD Sections 31 - 35)
- Dashboards with line charts, bar charts, donut charts, and scoped activity tables.

---

## 4. PRD Extension 02: Role-Based Support, Ticket Management & Escalation

### 4.1 Hierarchical Escalation Structure (PRD Section 40)
- Strict hierarchy: Viewer → Document Owner → Administrator.
- Internal administrative notes stripped from viewer views.
- Mandatory escalation reason & investigation summary.
- Support management console with 4 Recharts analytics charts.

---

## 5. PRD Extension 03: Settings, Preferences & Account Configuration

### 5.1 Unified Settings Architecture (PRD Sections 58–60)
- **Shared Navigation:** Accessible to all roles via sidebar navigation (`Settings & Preferences`) and top header account menu.
- **Two-Column Enterprise Layout:** Left navigation category menu with right responsive panel.
- **Save State Feedback:** Real-time indication of "All changes saved", "Unsaved changes pending", or "Saving...".

### 5.2 Role-Scoped Capabilities (PRD Sections 61–63)
- **Viewer Settings:** Personal profile (view-only role/status), preferred OTP delivery method (Email vs WhatsApp with phone verification), notification channels & triggers, appearance (Light, Dark Preview, System), table density (Comfortable / Compact), language, accessibility toggles, and formal deactivation request workflow.
- **Document Owner Settings:** Personal settings plus **Document & Workflow Preferences**: default category, table vs grid view, default sorting, initial sharing permission (mandatory default 'read'), confirm before upload, confirm before grant/revocation, and show revoked grants.
- **Administrator Platform Governance:** Personal settings plus:
  - **Platform Security & Access Policies:** OTP expiry, lockout thresholds, session timeout, mandatory access review frequency.
  - **Storage & Retention Policies:** Maximum upload size bound, permitted file types checklist, tamper-evident audit retention policy (minimum 30 days, default 7 years / 2555 days).
  - **Support Configuration:** Automated escalation thresholds, critical & normal SLA response targets.
  - **Operational Telemetry:** Monitored health indicators for Auth, Database, Storage, Audit Chain, and Notification Gateway, with latency and capacity tracking.

### 5.3 Security Invariants & Policy Enforcement (PRD Sections 64–66)
- **Anti-Privilege Escalation:** Injected `role`, `status`, or platform policy keys are rejected with `ROLE_ESCALATION_BLOCKED`.
- **Cross-User Isolation (IDOR Protection):** Users cannot modify other users' preferences (`UNAUTHORIZED_CROSS_USER`).
- **Audit Logging Immutability:** Muting personal notification delivery channels does *not* suppress cryptographic audit logging.

---

## 6. Automated Security Testing

TrustVault includes an automated test suite satisfying **PRD Section 8 (FR-14)**, **PRD Extension 01**, **PRD Extension 02**, and **PRD Extension 03**:

Run tests locally:
```bash
npm test
```

### Verified Test Cases (40 / 40 Passing):

#### 1. Baseline Security Suite (`src/tests/security.test.ts` — 10 Tests):
1. `FR-14.1`: User Bob cannot read Alice's unshared private document (`UNAUTHORIZED_ACCESS`).
2. `FR-14.2`: User Bob cannot download Alice's unshared document.
3. `FR-14.3`: User Bob cannot edit or delete Alice's document (`ONLY_OWNER_CAN_DELETE`).
4. `FR-14.4`: Viewer Bob cannot grant or manage permissions (`VIEWER_CANNOT_GRANT`).
5. `FR-14.5`: Non-admin users cannot perform administrative actions (`ADMIN_PRIVILEGE_REQUIRED`).
6. `FR-14.6`: Revoking a grant immediately denies subsequent read and edit attempts (`PERMISSION_REVOKED`).
7. `FR-14.7`: Disabled account Eve is denied on all protected document requests (`ACCOUNT_DISABLED`).
8. `FR-14.8`: Administrator cannot read unshared document contents by default (`ADMIN_CONTENT_RESTRICTED`).
9. `FR-14.9`: User with Read-only grant cannot perform Edit operations (`INSUFFICIENT_PERMISSIONS`).
10. `FR-14.10`: Audit hash chain validates authentic sequence and catches any malicious modification.

#### 2. Authentication & Website Suite (`src/tests/extension.test.ts` — 8 Tests):
11. `EXT-01`: Initiating Email OTP for registered user generates valid 6-digit challenge.
12. `EXT-02`: Initiating WhatsApp OTP for registered phone generates challenge.
13. `EXT-03`: OTP initiation rejected for deactivated account (Eve).
14. `EXT-04`: OTP initiation rejected for unlisted address (No Public Registration).
15. `EXT-05`: Rate-limiting / resend cooldown prevents rapid OTP spam.
16. `EXT-06`: Verifying OTP with wrong code fails and decrements attempts.
17. `EXT-07`: **Role Mismatch Enforcement:** Viewer attempting Admin portal is rejected (`ROLE_MISMATCH`).
18. `EXT-08`: Successful OTP verification yields authenticated session for matching role.

#### 3. Support, Ticket Management & Escalation Suite (`src/tests/support.test.ts` — 10 Tests):
19. `SUPP-01`: **Horizontal Viewer Isolation:** Viewer A cannot read Viewer B's private support ticket.
20. `SUPP-02`: **Viewer Message Protection:** Viewer A cannot reply to Viewer B's ticket.
21. `SUPP-03`: **Arbitrary Owner Assignment Block:** Assigned owner derived from document metadata.
22. `SUPP-04`: **Unauthorized Document Referencing Block:** Viewer cannot reference unshared documents.
23. `SUPP-05`: **Viewer Direct Escalation Block:** Viewer cannot directly escalate to Administrator (`VIEWER_CANNOT_ESCALATE`).
24. `SUPP-06`: **Mandatory Escalation Reason Enforcement:** Owner cannot escalate without reason and summary.
25. `SUPP-07`: **Owner Ticket Isolation:** Owner cannot inspect unrelated owners' tickets.
26. `SUPP-08`: **Internal Notes Filtering:** Internal notes strictly stripped from Viewer message views.
27. `SUPP-09`: **Admin Document Boundary Preservation:** Administrative ticket access does *not* grant document access.
28. `SUPP-10`: **Escalation Conversation Integrity:** Escalating a ticket preserves all prior message history.

#### 4. Settings, Preferences & Platform Governance Suite (`src/tests/settings.test.ts` — 14 Tests):
29. `SET-01`: Viewer cannot modify administrative settings (`UNAUTHORIZED_ADMIN_SETTING`).
30. `SET-02`: Owner cannot change global upload restrictions or grant admin privileges (`ROLE_ESCALATION_BLOCKED`).
31. `SET-03`: Administrator cannot elevate their own role through settings (`ROLE_ESCALATION_BLOCKED`).
32. `SET-04`: Cross-user isolation: User A cannot update User B's personal preferences (`UNAUTHORIZED_CROSS_USER`).
33. `SET-05`: Privilege parameter injection block: Injected keys stripped and rejected (`ROLE_ESCALATION_BLOCKED`).
34. `SET-06`: Notification preferences do not suppress cryptographic audit ledger recording.
35. `SET-07`: Invalid theme, language, or density values are strictly rejected by validation.
36. `SET-08`: Authentication method change cannot bypass phone verification.
37. `SET-09`: Retention & audit policy bounds: Audit retention cannot be reduced below compliance threshold (< 30 days).
38. `SET-10`: Atomic configuration rollback: Failed updates do not leave partially applied policy state.
39. `SET-11`: Deactivated accounts are denied from modifying settings (`ACCOUNT_DISABLED`).
40. `SET-12`: Account deactivation request queues administrative review instead of immediate client destruction.
41. `SET-13`: **Admin Deactivation Prohibition:** Administrator accounts cannot be deactivated via self-request (`ADMIN_DEACTIVATION_PROHIBITED`).
42. `SET-14`: **Administrative Review Queue:** Administrators can inspect, approve, or dismiss deactivation requests; non-admins are strictly denied (`ADMIN_ACCESS_REQUIRED`).

#### 5. Supabase Backend Integration & Production Readiness Suite (`src/tests/supabaseBackend.test.ts` — 11 Tests):
43. `SUPA-01`: **Client & Environment Configuration (PRD 73):** Validates live connection to `https://eobkbwqzryjscrowncuj.supabase.co` and verifies client publishable key.
44. `SUPA-02`: **Backend Health Probe:** Probes database tables and storage connectivity with bounded timeouts.
45. `SUPA-03`: **Account Provisioning:** Administrator can provision approved accounts; non-admins are strictly rejected (`ADMIN_ACCESS_REQUIRED`).
46. `SUPA-04`: **Privilege Escalation Prevention (PRD 74.3):** Non-admins blocked from provisioning or altering account roles.
47. `SUPA-05`: **Root Admin Protection (PRD 74.3):** Prohibits deactivating root administrator accounts in backend state.
48. `SUPA-06`: **Storage Quota Enforcement (PRD 77.1):** Rejects file uploads exceeding 25MB enterprise file-size limit (`FILE_TOO_LARGE`).
49. `SUPA-07`: **Deactivated Upload Prohibition (PRD 77.3):** Disabled accounts blocked from uploading documents to private storage.
50. `SUPA-08`: **Immediate Revocation Read Authorization (PRD 79):** Authorizes document download when an active explicit grant is present.
51. `SUPA-09`: **Immediate Revocation Enforcement (PRD 79):** Immediately denies subsequent document downloads once grant is revoked by owner.
52. `SUPA-10`: **Support Message Data Isolation (PRD 76.4):** Strictly hides internal support notes from viewers.
53. `SUPA-11`: **Security Regression Check (PRD 83.4):** Demonstrates that bypassing authorization checks causes tests to demonstrably fail.

---

## 7. PRD Extension 04: Supabase Backend Integration & Production Readiness

### 7.1 Backend Architecture
- **Supabase Project:** `https://eobkbwqzryjscrowncuj.supabase.co`
- **Authentication:** Supabase GoTrue with session persistence, role validation, and disabled account blocking.
- **PostgreSQL Database:** 10 core tables with comprehensive Row Level Security (RLS) policies, triggers, and RPCs:
  - `public.profiles`
  - `public.documents`
  - `public.permission_grants`
  - `public.support_tickets`
  - `public.ticket_messages`
  - `public.ticket_events`
  - `public.user_preferences`
  - `public.system_settings`
  - `public.audit_events`
  - `public.deactivation_requests`
- **Private Storage:** `vault-documents` non-public bucket with 25MB file-size limit and storage access policies.
- **Immediate Revocation (PRD 79):** Revocation updates authoritative database state immediately. Subsequent download or read requests fail closed.
- **Audit Integrity (PRD 80):** Immutable SHA-256 hash-chained ledger verifying chronological sequence continuity.

### 7.2 Database Migrations
Version-controlled migrations are stored in `supabase/migrations/`:
1. `20261025000000_trustvault_core_schema.sql`: Core PostgreSQL schema, RLS policies, escalation triggers, and RPC functions.
2. `20261025000001_seed_initial_data.sql`: Seed data for users, documents, permissions, settings, and support tickets.
3. `20261025000002_storage_vault_documents.sql`: Private bucket configuration and storage object policies.

---

## 8. Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (53/53 passing)
npm test

# 3. Check TypeScript types & build bundle
npm run build

# 4. Start local development server
npm run dev
```

The web application is available at: `http://localhost:5174/`

---

## 9. Security Documentation Artifacts
- **Threat Model Matrix:** [`THREATS.md`](./THREATS.md) — 33 mandatory risk scenarios, countermeasures, residual risks, and automated test mappings.
- **Engineering Journal:** [`PROMPTS.md`](./PROMPTS.md) — Chronological engineering milestones and security decisions.
