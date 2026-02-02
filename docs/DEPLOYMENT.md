# Demo Project Deployment Guide

Standard deployment process for all demo projects built from the project template. These projects use **.NET 8 + React/Vite/TypeScript** with **Dapper + SQL Server** on **IIS (Windows)**.

---

## Architecture Overview

```
Browser → Cloudflare (SSL) → IIS (port 80/443)
                                ├── / (WWW folder) → React SPA
                                └── /api (virtual app) → .NET 8 backend
```

**Server:** FTPB1 (Windows, self-hosted GitHub Actions runner `IIS-Deploy`)
**Folder convention:** `F:\New_WWW\{SiteName}\` with `WWW\` (frontend) and `API\` (backend)

---

## Naming Convention

When projects are provisioned through SynthiaDash:

| Property | Format | Example |
|----------|--------|---------|
| IIS Site Name | `Demo_{Id}_{Title}` | `Demo_1_TomProject` |
| App Pool | Same as site name | `Demo_1_TomProject` |
| Database | Same as site name | `Demo_1_TomProject` |
| Host header (public URL) | `{slug}.synthia.bot` | `dressapp.synthia.bot` |
| Folder | `F:\New_WWW\Demo_1_TomProject\` | — |

For standalone projects, the site name = domain (e.g., `dressapp.synthia.bot`).

---

## Quick Reference: Common Commands

```bash
# Clone and enter a project
cd ~/repos && git clone https://github.com/3E-Tech-Corp/{project}.git
cd {project}

# Make changes, commit, push
git add -A && git commit -m "description" && git push origin main

# Deploy (trigger workflow)
gh workflow run deploy.yml --ref main

# Watch deployment
gh run list --workflow=deploy.yml -L 1 --json databaseId,status
gh run watch {run_id} --exit-status
```

---

## First-Time Setup (New Project)

### 1. Create the GitHub Repository

Use `3E-Tech-Corp` org. Initialize from the project template or create empty and push.

### 2. Set Repository Variable

```bash
gh variable set IIS_SITE_NAME --body "Demo_1_TomProject" --repo 3E-Tech-Corp/{project}
```

This tells the deploy workflow which IIS site to target.

### 3. Provision IIS + Database

**Option A:** Run the `Provision IIS Site` workflow:
```bash
gh workflow run provision.yml \
  --field site_name="Demo_1_TomProject" \
  --field db_name="Demo_1_TomProject" \
  --field domain="dressapp.synthia.bot" \
  --field project_name="Tom Project"
```

**Option B:** Run `Setup IIS Site` workflow (lighter, no build):
```bash
gh workflow run setup-site.yml \
  --field site_name="Demo_1_TomProject" \
  --field host_header="dressapp.synthia.bot" \
  --field db_name="Demo_1_TomProject"
```

Both create:
- IIS site + app pool (No Managed Code, Integrated pipeline)
- `/api` virtual application → `API\` folder
- SQL Server database with `ftsql` user permissions
- `appsettings.Production.json` with connection string + random JWT key
- SPA `web.config` for client-side routing
- Placeholder `index.html`

### 4. Configure DNS (Cloudflare)

Add a CNAME or A record pointing `{slug}.synthia.bot` to the server.
Cloudflare handles SSL termination (Full/Strict mode with origin cert).

### 5. First Deploy

```bash
gh workflow run deploy.yml --ref main
```

### 6. Verify

```bash
# API health check
curl https://{domain}/api/health

# Login (default admin account is created on first run via /auth/setup)
curl -s https://{domain}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Synth!@"}'
```

---

## Routine Deployment (Code Changes)

### 1. Make Changes

Edit files locally (controllers, frontend components, etc.).

### 2. Commit and Push

```bash
cd ~/repos/{project}
git add -A
git commit -m "fix: description of change"
git push origin main
```

### 3. Trigger Deploy

```bash
gh workflow run deploy.yml --ref main
```

### 4. Monitor

```bash
# Quick status check
gh run list --workflow=deploy.yml -L 1

# Watch live
gh run watch {run_id} --exit-status
```

### 5. Verify

```bash
curl https://{domain}/api/health
```

---

## What the Deploy Workflow Does

1. **Build job** (Ubuntu runner):
   - `dotnet publish` the backend (.NET 8, Release config)
   - `npm ci && npm run build` the frontend (Vite)
   - Upload both as artifacts

2. **Deploy job** (self-hosted Windows runner):
   - Stop the IIS app pool
   - Backup current deployment to `F:\deploy-backups\{SiteName}\{timestamp}\` (keeps last 5)
   - Deploy frontend to `WWW\`
   - Deploy backend to `API\` — **preserves `appsettings.Production.json`**
   - Start the IIS app pool
   - Run health check (`/api/health`)

---

## Controller Route Convention

⚠️ **Critical:** Since the backend runs as an IIS virtual application at `/api`, controller routes must **NOT** include `api/` prefix:

```csharp
// ✅ CORRECT — IIS provides the /api prefix
[Route("[controller]")]
public class AuthController : ControllerBase { }

// ✅ CORRECT — custom route without api/ prefix
[Route("dress-designs")]
public class DressDesignController : ControllerBase { }

// ❌ WRONG — results in /api/api/controller (double prefix)
[Route("api/[controller]")]
public class AuthController : ControllerBase { }
```

---

## Project Structure

```
{project}/
├── .github/workflows/
│   ├── deploy.yml          # Main deploy (workflow_dispatch)
│   ├── build.yml           # CI build check
│   ├── provision.yml       # First-time IIS + DB + build + deploy
│   ├── setup-site.yml      # First-time IIS + DB (no build)
│   ├── fix-db.yml          # Grant ftsql DB permissions
│   ├── add-https-binding.yml  # Add HTTPS with origin cert
│   ├── check-bindings.yml  # Diagnostic: list IIS sites/certs
│   └── rename-site.yml     # Rename IIS site/pool/DB
├── backend/
│   └── ProjectTemplate.Api/
│       ├── Controllers/     # API controllers
│       ├── Models/          # Data models
│       ├── Services/        # Business logic
│       ├── Migrations/      # SQL migration scripts
│       ├── Program.cs       # App startup + JWT config
│       └── ProjectTemplate.Api.csproj
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # Shared components
│   │   ├── contexts/        # Auth context, etc.
│   │   ├── services/        # API client (api.ts)
│   │   └── App.tsx          # Router + auth guard
│   ├── package.json
│   └── vite.config.ts
└── Deployment/
    ├── deploy-iis.ps1       # IIS deploy script
    └── provision-iis.ps1    # IIS provisioning script
```

---

## Server Configuration

### IIS Layout (per site)

```
F:\New_WWW\{SiteName}\
├── WWW\                  # Frontend (React SPA build output)
│   ├── index.html
│   ├── assets/
│   └── web.config        # SPA rewrite rules (fallback to index.html)
└── API\                  # Backend (.NET 8 published output)
    ├── ProjectTemplate.Api.dll
    ├── appsettings.json
    └── appsettings.Production.json  # ⚠️ Server-only, not in git
```

### appsettings.Production.json (auto-generated)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database={DB};User ID=ftsql;Password=***;TrustServerCertificate=true;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "{random-32-char-key}",
    "Issuer": "ProjectTemplate",
    "Audience": "ProjectTemplate",
    "ExpiryHours": 24
  },
  "Cors": {
    "Origins": "https://{domain}"
  }
}
```

This file is **preserved across deployments** and **never committed to git**.

### SSL Certificates

| Domain | Cert | Store | Managed By |
|--------|------|-------|------------|
| `*.synthia.bot` | `CN=synthia.bot` | WebHosting | win-acme (auto-renew) |
| `*.funtimepb.com` | `CN=*.funtimepb.com` | WebHosting | win-acme |
| `pickleball.community` | `CN=pickleball.community` | WebHosting | win-acme |

Cloudflare handles SSL termination for most sites. Origin certs are for Full (Strict) mode.

---

## Database

- **Engine:** SQL Server Express (localhost on FTPB1)
- **ORM:** Dapper (lightweight, raw SQL)
- **Login:** `ftsql` with datareader + datawriter + ddladmin + execute permissions
- **Migrations:** Manual SQL scripts in `backend/ProjectTemplate.Api/Migrations/`
  - ⚠️ **No auto-migration runner** — migrations must be applied manually or via workflow
  - Use `fix-db.yml` workflow if `ftsql` permissions need to be re-granted

### Backup Before Major Changes

```sql
-- On server via Invoke-Sqlcmd or SSMS
EXEC [master].[dbo].[sp_fxbackup] @databaseName = '{DB}', @backupType = 'F'
```

---

## Authentication

- **JWT Bearer** tokens, configured in `Program.cs`
- Default admin account: `admin` / `Synth!@` (email: `admin@synthia.bot`)
- Login accepts **username or email**
- `/auth/setup` endpoint creates the first admin (only works when Users table is empty)
- `/auth/register` requires Admin role

---

## Available Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy.yml` | Manual | Build + deploy to IIS |
| `build.yml` | Push/PR | CI build check only |
| `provision.yml` | Manual | Full first-time setup (IIS + DB + build + deploy) |
| `setup-site.yml` | Manual | Create IIS site + DB (no build) |
| `fix-db.yml` | Manual | Re-grant ftsql permissions |
| `add-https-binding.yml` | Manual | Add HTTPS binding with origin cert |
| `check-bindings.yml` | Manual | Diagnostic: list all IIS sites and certs |
| `rename-site.yml` | Manual | Rename IIS site/pool/DB |

---

## Troubleshooting

### Login flashes error and reloads page
The frontend `api.ts` had a bug where ALL 401 responses triggered a redirect to `/login`, including failed login attempts. Fix: the 401 handler now skips redirect for `/auth/login` and `/auth/setup` endpoints.

### Double `/api/api/` in URLs
Controller routes had `[Route("api/[controller]")]` but IIS virtual app already mounts at `/api`. Fix: use `[Route("[controller]")]`.

### Database permissions error
New databases need `ftsql` user explicitly granted access. Run `fix-db.yml` or:
```sql
USE [{DB}];
CREATE USER [ftsql] FOR LOGIN [ftsql];
ALTER ROLE db_datareader ADD MEMBER [ftsql];
ALTER ROLE db_datawriter ADD MEMBER [ftsql];
ALTER ROLE db_ddladmin ADD MEMBER [ftsql];
GRANT EXECUTE TO [ftsql];
```

### PowerShell here-string issues in GitHub Actions
The `"@` terminator MUST be at column 0 in Windows PowerShell. Avoid here-strings in YAML — use single-line strings or `ConvertTo-Json` instead.

### `appsettings.Production.json` missing after deploy
The deploy script preserves this file. If it's missing, re-run `setup-site.yml` with a db_name, or create it manually on the server.

### Health check fails but site works
Health check uses `localhost` with Host header. If the IIS binding doesn't match, it may fail. Test via the public URL instead.

---

## Checklist: New Demo Project

- [ ] Create repo under `3E-Tech-Corp`
- [ ] Set `IIS_SITE_NAME` repo variable
- [ ] Add Cloudflare DNS record
- [ ] Run `provision.yml` or `setup-site.yml`
- [ ] Run `deploy.yml`
- [ ] Verify health check: `curl https://{domain}/api/health`
- [ ] Log in with default credentials
- [ ] (Optional) Add HTTPS origin binding via `add-https-binding.yml`
