# AuthCraft System Architecture & Security Specification

## 1. System Overview

AuthCraft is a modular, configuration-driven Authentication-as-a-Service (AaaS) platform. It provides developers with complete authentication infrastructure, automated user management, and customizable hosted login and registration pages without building an authentication backend from scratch.

### Architectural Principles
- **No-Code Visual Builder**: Developers configure styling, typography, branding, and layouts via a reactive dashboard without editing code.
- **Strict Project Isolation**: All user identities, credentials, tokens, and audit logs are logically and relationally partitioned by `project_id`.
- **RFC 9106 Argon2id Cryptography**: Industry-standard password hashing with high memory cost and constant-time verification.
- **Deterministic Software Engineering**: Zero AI/LLM dependencies or paid AI API keys.
- **Direct Hosted Login URL**: The primary integration method is a shareable, responsive hosted web URL (`/login/{project_slug}`).

---

## 2. Core Components

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Public Website /   |  | Developer Dashboard  |  | Hosted Auth Pages         |  |
|  | Marketing Site     |  | & Visual Builder     |  | (/login/[slug], etc.)     |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                (HTTP / REST API)
                                         v
+-----------------------------------------------------------------------------------+
|                                BACKEND API LAYER                                  |
|  +-----------------------------------------------------------------------------+  |
|  | FastAPI Gateway (CORS, Rate Limiter, Route Middleware)                      |  |
|  +-----------------------------------------------------------------------------+  |
|  | Core Services:                                                              |  |
|  | - Security & Argon2id Hasher                                                |  |
|  | - JWT Session Engine & Secure Cookie Manager                               |  |
|  | - Single-Use Token Hash Dispatcher                                          |  |
|  | - Allowlist Validator (Redirect URIs & Origins)                             |  |
|  | - Audit Event Logger                                                        |  |
|  | - Dev Mailbox / Production SMTP                                             |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                (SQLAlchemy ORM)
                                         v
+-----------------------------------------------------------------------------------+
|                                 DATA ACCESS LAYER                                 |
|  PostgreSQL 16 (Production) / SQLite (Local Zero-Config Dev)                       |
|  - developers & developer_sessions                                                |
|  - projects, allowed_origins, allowed_redirect_uris                               |
|  - project_configurations (draft & versioned published records)                   |
|  - application_users & user_sessions (scoped strictly by project_id)              |
|  - verification_tokens (SHA-256 hashed single-use tokens)                         |
|  - authentication_events (audit logs)                                             |
+-----------------------------------------------------------------------------------+
```

---

## 3. Cryptography & Security Controls

### 3.1 Password Security
- Passwords are never logged, transmitted in cleartext over unencrypted channels, or stored in plaintext.
- Hasher: **Argon2id** (`Type: argon2.Type.ID`, `time_cost=3`, `memory_cost=65536` KiB, `parallelism=4`).
- Constant-time verification prevents side-channel timing attacks.

### 3.2 Session Handling
- Browser sessions use HTTP-only, `SameSite=Lax` cookies with configurable `Secure` flags for HTTPS deployments.
- Session tokens are URL-safe 32-byte cryptographic random values.
- Only SHA-256 hashes of session tokens are stored in the database.
- Sessions can be revoked individually by developers or automatically on password resets.

### 3.3 Anti-Enumeration & Generic Errors
- Authentication failure responses return generic errors (`Invalid email or password`) to prevent account enumeration.
- Password reset endpoints return identical success messages regardless of whether the requested email address exists in the system.

### 3.4 Strict Open Redirect Prevention
- Redirects triggered by `?redirect_uri=...` must match the project's explicit `allowed_redirect_uris` table.
- Arbitrary destination URLs are rejected with HTTP 400 Bad Request.
