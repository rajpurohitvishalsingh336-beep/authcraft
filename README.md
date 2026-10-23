# AuthCraft — No-Code Authentication-as-a-Service (AaaS)

> **“Authentication, Without the Complexity.”**  
> Create, customize, and publish secure login experiences for your applications without building an authentication backend from scratch.

AuthCraft is a complete, production-grade, configuration-driven Authentication-as-a-Service platform. It provides developers, startups, students, and small teams with full authentication infrastructure, automated user management, and a visual builder for customized, branded hosted login and registration pages.

---

## 1. Key Features

- **One-Click Shareable Hosted Login URL**: Generate directly shareable, responsive hosted authentication pages (`/login/{project_slug}`). Anyone with the published link can authenticate without an AuthCraft developer account.
- **Visual Login Page Builder**: Side-by-side builder with instant reactive live preview for branding, color palettes, dark/light themes, typography, button styles, and form toggles.
- **Predefined Design Templates**: Minimal, Modern, Professional, Dark, Startup, Classic.
- **Strict Project-Level Data Isolation**: Multi-tenant database design where application users, sessions, tokens, and audit events are strictly isolated by `project_id`.
- **RFC 9106 Argon2id Password Hashing**: State-of-the-art password security with high memory cost (`m=65536, t=3, p=4`) and constant-time verification.
- **Generic Failure Responses & Anti-Enumeration**: Safe error messaging preventing account discovery.
- **Strict Redirect URI Allowlisting**: Open redirects to unapproved destinations are completely blocked.
- **Zero AI / Zero Paid API Dependencies**: Deterministic software architecture with zero LLM API costs or vendor lock-in.
- **Local Dev Email Outbox**: Built-in inspection mailbox for testing email verification and password reset flows with zero external SMTP dependencies.

---

## 2. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2 (`ConfigDict`, `model_validate`), SQLAlchemy 2.0 ORM, Alembic migrations.
- **Security & Cryptography**: `argon2-cffi` (RFC 9106 Argon2id), PyJWT, `secrets.token_urlsafe`, SHA-256 token hashing.
- **Database**: PostgreSQL 16 (Production/Docker) with SQLite fallback for instant zero-configuration local development.
- **Containerization**: Docker & Docker Compose (`db`, `backend`, `frontend`).
- **Automated Tests**: Pytest, HTTPX, Starlette TestClient.

---

## 3. Repository Structure

```
authcraft/
├── backend/
│   ├── alembic/              # Database migration versions and environment
│   ├── app/
│   │   ├── api/v1/           # Modular FastAPI routes (dev_auth, projects, builder, hosted_auth, admin)
│   │   ├── core/             # Configuration, Argon2id security, database engine
│   │   ├── models/           # SQLAlchemy declarative models
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   ├── services/         # Dev email outbox, security audit logger
│   │   └── main.py           # FastAPI entrypoint, CORS, lifespan, exception handlers
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/    # Overview, Projects, Visual Builder, Users, Events, Sessions, Settings, Docs
│   │   │   ├── login/        # Developer Sign In & Hosted Login (/login/[slug])
│   │   │   ├── register/     # Developer Sign Up & Hosted Register (/register/[slug])
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── verify-email/
│   │   │   ├── demo-app/     # Callback redirect test application
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx      # Public SaaS marketing landing page
│   │   └── lib/              # API client, TypeScript types
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
├── docs/
│   ├── ARCHITECTURE.md       # System boundaries, cryptography specs, threat model
│   ├── API_REFERENCE.md      # Complete REST API documentation
│   └── DEPLOYMENT.md         # Production deployment, PostgreSQL migrations & backups
├── tests/                    # Automated Pytest suite
│   ├── conftest.py
│   ├── test_developer_auth.py
│   ├── test_projects.py
│   ├── test_cross_project_isolation.py
│   └── test_end_to_end_journey.py
├── docker-compose.yml        # Multi-container production stack
├── .env.example              # Environment configuration template
└── README.md
```

---

## 4. Quick Start Guide

### Option A: Local Development (Fastest, zero-config)

#### 1. Backend Setup
```bash
cd backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI backend server (Runs on port 8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Docs: `http://localhost:8000/api/v1/docs`
- Health check: `http://localhost:8000/health`

#### 2. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install packages
pnpm install # or npm install

# Start Next.js development server (Runs on port 3000)
pnpm run dev # or npm run dev
```
Open `http://localhost:3000` in your browser.

---

### Option B: Docker Compose (Full Stack with PostgreSQL)

```bash
cp .env.example .env
docker compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 5. End-to-End Developer Workflow

1. **Sign Up**: Navigate to `http://localhost:3000/register` to create a developer account.
2. **Create a Project**: Click **+ New Project** in the dashboard. AuthCraft generates a unique Project ID (e.g., `prj_3fa85f64...`) and a unique slug.
3. **Customize in Visual Builder**: Open **Login Page Builder**, choose a preset template (Modern, Minimal, Dark, Startup, Professional, Classic), adjust colors, typography, border radius, and labels. Live changes appear reactively in the preview pane.
4. **Publish Configuration**: Click **Publish to Live Link**.
5. **Share Hosted Login URL**: AuthCraft displays your live hosted URL:  
   `http://localhost:3000/login/<project-slug>`
6. **Onboard End Users**: Users navigate directly to this URL to register and log in.
7. **Monitor Activity**: View real-time user registrations, logins, active sessions, and audit events from the **Users** and **Authentication Events** tabs in the dashboard.

---

## 6. Automated Testing

AuthCraft includes an automated test suite verifying:
- Developer registration & Argon2id hashing
- Session establishment and cookie handling
- Password reset and email verification flows
- Project ownership isolation
- Visual builder draft saving & template presets
- Configuration publishing & public resolver
- **Cross-Project Data Isolation**: Validating that users with the same email across different projects have completely separated credentials and cannot access each other's resources.
- **Complete 13-Step End-to-End Journey**: Validating the full lifecycle from developer registration to hosted login, verification, and logout.

### Running Backend Tests
```bash
# In the root directory:
pytest tests/ -v
```

### Verified Test Results
```
tests/test_cross_project_isolation.py::test_cross_project_data_isolation PASSED [ 12%]
tests/test_developer_auth.py::test_developer_registration_and_argon2 PASSED      [ 25%]
tests/test_developer_auth.py::test_developer_registration_duplicate_fails PASSED [ 37%]
tests/test_developer_auth.py::test_developer_login_and_session PASSED           [ 50%]
tests/test_developer_auth.py::test_developer_password_reset_flow PASSED         [ 62%]
tests/test_end_to_end_journey.py::test_complete_13_step_journey PASSED          [ 75%]
tests/test_projects.py::test_project_lifecycle_and_builder_config PASSED        [ 87%]
tests/test_projects.py::test_project_ownership_isolation PASSED                 [100%]

======================== 8 passed in 2.55s =========================
```

---

## 7. Security Architecture

- **Argon2id Hashing**: Uses `argon2-cffi` configured with RFC 9106 recommendations.
- **Short-Lived Single-Use Tokens**: Verification and reset tokens are 32-byte URL-safe cryptographic strings, stored in the database exclusively as SHA-256 hashes.
- **No Client Secrets in Browser**: Project IDs are public routing identifiers; API secrets are optional and restricted to server-side integrations.
- **Open Redirect Guard**: Every `redirect_uri` passed during login is verified against the project's explicit allowlist.
- **Rate Limiting**: Critical authentication endpoints are rate-limited to mitigate brute-force attempts.

---

## 8. License

MIT License. AuthCraft is open-source and free for development and commercial use.
