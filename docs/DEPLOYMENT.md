# AuthCraft Production Deployment & Operations Guide

## 1. Prerequisites
- Docker Engine 24+ & Docker Compose v2, OR
- Python 3.10+ (with venv) & Node.js 18+ (with pnpm/npm)
- PostgreSQL 14+ database instance

---

## 2. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Critical Environment Variables
| Variable | Production Requirement | Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Must be `production` | `production` |
| `DEBUG` | Must be `False` | `False` |
| `SECRET_KEY` | High-entropy random secret (min 32 chars) | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db-host:5432/dbname` |
| `FRONTEND_URL` | Public developer dashboard URL | `https://console.authcraft.com` |
| `PUBLIC_HOSTED_DOMAIN`| Base domain for hosted login links | `https://auth.authcraft.com` |
| `COOKIE_SECURE` | Must be `True` when served over HTTPS | `True` |
| `DEV_EMAIL_MODE` | Must be `False` in production | `False` |

---

## 3. Deployment with Docker Compose

To start the complete production stack (PostgreSQL + FastAPI Backend + Next.js Frontend):
```bash
docker compose up -d --build
```

Verify service health:
```bash
docker compose ps
curl http://localhost:8000/health
```

---

## 4. Database Migrations

AuthCraft uses Alembic for declarative schema versioning.

### Run migrations to latest:
```bash
cd backend
alembic upgrade head
```

### Roll back one migration:
```bash
cd backend
alembic downgrade -1
```

---

## 5. Backup & Disaster Recovery

### PostgreSQL Backup:
```bash
docker exec -t authcraft-postgres pg_dump -U authcraft_user authcraft_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### PostgreSQL Restore:
```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i authcraft-postgres psql -U authcraft_user -d authcraft_db
```

---

## 6. Operational Checklist
- [ ] `DEBUG=False` verified in backend.
- [ ] `SECRET_KEY` rotated from default sample.
- [ ] HTTPS certificates (TLS 1.3) provisioned for frontend and backend domains.
- [ ] Database connection pool limits tuned for target concurrency.
- [ ] Automated daily database snapshots scheduled.
- [ ] Developer account registered and password verified.
