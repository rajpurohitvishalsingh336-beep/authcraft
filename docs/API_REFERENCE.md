# AuthCraft API Reference Specification

All endpoints are versioned under the `/api/v1` namespace.

---

## 1. Developer Authentication API

### `POST /api/v1/auth/register`
Registers a new developer account.
- **Request Body**:
  ```json
  {
    "full_name": "Developer Name",
    "email": "developer@company.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `201 Created`: Developer registered successfully.
  - `400 Bad Request`: Account with this email already exists or invalid password.

### `POST /api/v1/auth/login`
Authenticates developer, issues signed JWT, and sets `authcraft_dev_session` HTTP-only cookie.
- **Request Body**:
  ```json
  {
    "email": "developer@company.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: `{"access_token": "...", "token_type": "bearer", "developer": {...}}`
  - `401 Unauthorized`: Generic error `Invalid email or password`.

### `POST /api/v1/auth/logout`
Revokes session and clears HTTP-only cookie. Requires Bearer token or cookie.
- **Responses**:
  - `200 OK`: `{"message": "Successfully logged out."}`

### `GET /api/v1/auth/me`
Retrieves authenticated developer profile.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Responses**:
  - `200 OK`: `{"id": "...", "email": "...", "full_name": "...", "is_verified": true}`

---

## 2. Project Management API

### `GET /api/v1/projects`
Lists all projects owned by the authenticated developer with computed counts (`total_users`, `total_events`).

### `POST /api/v1/projects`
Creates a new isolated application project.
- **Request Body**:
  ```json
  {
    "name": "My Application",
    "description": "Optional description",
    "allow_registration": true,
    "require_email_verification": false,
    "session_duration_minutes": 1440,
    "password_min_length": 8
  }
  ```
- **Responses**:
  - `201 Created`: Returns project details including generated `id` (`prj_...`), unique `slug`, and `hosted_login_url`.

### `POST /api/v1/projects/{project_id}/publish`
Promotes the latest draft configuration to production, increments `published_version`, and marks hosted login URL active.

---

## 3. Visual Login Page Builder API

### `GET /api/v1/projects/{project_id}/draft`
Fetches draft configuration for the visual builder.

### `PUT /api/v1/projects/{project_id}/draft`
Saves draft changes made in the visual builder (branding, palette, typography, layout, toggles).

### `POST /api/v1/projects/{project_id}/apply-template/{template_name}`
Applies a predefined design preset (`modern`, `minimal`, `professional`, `dark`, `startup`, `classic`).

---

## 4. Hosted End-User Authentication API

### `GET /api/v1/public/projects/{slug}/config`
Public resolver used by hosted login and registration pages to retrieve verified active branding.
- **Responses**:
  - `200 OK`: `{"status": "ready" | "unpublished" | "disabled", "brand_name": "...", "primary_color": "...", ...}`

### `POST /api/v1/projects/{project_id}/auth/register`
Registers an application end user strictly scoped to `project_id`.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "display_name": "User Name",
    "redirect_uri": "https://myapp.com/callback"
  }
  ```
- **Responses**:
  - `200 OK`: Returns authenticated user profile, session token, and validated `redirect_uri`.
  - `400 Bad Request`: Email already exists in this project or invalid redirect URI.

### `POST /api/v1/projects/{project_id}/auth/login`
Authenticates an end user within `project_id` using Argon2id password verification.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "redirect_uri": "https://myapp.com/callback"
  }
  ```
- **Responses**:
  - `200 OK`: `{"message": "Sign in successful.", "user": {...}, "session_token": "...", "redirect_uri": "..."}`
  - `401 Unauthorized`: Generic error `Invalid email or password`.
