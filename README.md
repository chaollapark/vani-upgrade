# Vani Wiki Infrastructure

Docker infrastructure for 8 Vanipedia MediaWiki 1.43 LTS wikis running on Hetzner.

## Quick Reference

| Wiki | Port | Pages | Skin | Extensions |
|------|------|-------|------|------------|
| vanisource | 8082 | 68,284 | VaniSkin | 18 |
| vaniquotes | 8083 | 292,706 | VaniSkin | 24 |
| vanipedia | 8084 | 136,464 | VaniSkin | 46 |
| vanitest | 8085 | 134,618 | VaniSkin | 46 |
| vanimedia | 8086 | 20,679 | VaniSkin | 10 |
| vanibooks | 8087 | 35 | Vector | 11 |
| vanictionary | 8088 | 44 | Vector | 9 |
| vaniversity | 8089 | 36 | Vector | 9 |

## Architecture

17 Docker containers on a single Hetzner host:

```
                        ┌─────────────────────────────────────────────┐
                        │               Hetzner EX44                  │
                        │                                             │
 localhost:8082─8089 ─► │  nginx-<wiki> (8x)  ──► mediawiki-<wiki>   │
                        │    Nginx Alpine           PHP 8.2-FPM       │
                        │    static assets          MW 1.43 + SMW 5.x │
                        │                                             │
                        │  memcached (1x, 128MB, shared)              │
                        │                                             │
                        │  mariadb-prod (external, port 3307)         │
                        │                                             │
                        │  shared-net Docker network                  │
                        └─────────────────────────────────────────────┘
```

- **8x `mediawiki-<wiki>`** — PHP 8.2-FPM containers, each running MW 1.43 with SMW 5.x (installed via Composer)
- **8x `nginx-<wiki>`** — Nginx Alpine reverse proxies, each on a unique port (8082-8089)
- **1x `memcached`** — Shared cache (128MB)
- **`mariadb-prod`** — Shared MariaDB on `shared-net` (port 3307, managed separately)
- **Images** — Bind-mounted from `/data/vani-mirror/www/<wiki>/w/images`
- **Secrets** — Injected via `.env` file (see [Secrets Management](#secrets-management))

All containers share a single `Dockerfile` at `mediawiki/Dockerfile`. Per-wiki config (LocalSettings.php, nginx conf, extensions, skins) is bind-mounted as read-only volumes.

## Repository Layout

```
vani-upgrade/
├── docker-compose.yml          # All 17 services
├── mediawiki/
│   └── Dockerfile              # Shared MW 1.43 + PHP 8.2-FPM + SMW 5.x
├── nginx/
│   └── <wiki>.conf             # Per-wiki nginx config (8 files)
├── <wiki>/                     # Per-wiki directory (8 wikis)
│   ├── LocalSettings.php       # MediaWiki config
│   ├── global/                 # Shared permissions.php
│   ├── extensions/             # Custom/non-bundled extensions
│   ├── skins/VaniSkin/         # VaniSkin (if applicable)
│   ├── env/<wiki>.env.php      # DB credentials for custom extensions (if needed)
│   └── menu.dat                # VaniSkin menu (if applicable)
├── tests/
│   ├── run-all-tests.sh        # Test runner (all wikis or specific)
│   ├── test-<wiki>.sh          # Per-wiki test suites (8 files)
│   └── lib/test-helpers.sh     # Shared test functions
├── docs/
│   ├── migration-summary.md    # Executive summary of all 8 migrations
│   ├── migration-<wiki>.md     # Per-wiki migration reports (8 files)
│   └── operations.md           # Day-to-day ops guide
├── .env.example                # Template for secrets
└── CLAUDE.md                   # Lessons learned for AI-assisted sessions
```

## Getting Started

### Prerequisites

- SSH access to Hetzner: `ssh -i ~/.ssh/id_ed25519_hetzner_ex44 root@157.180.7.100`
- `.env` file with DB password and per-wiki secret keys (copy from `.env.example`)

### SSH Tunnel for Browser Testing

```bash
# Forward a wiki's port to your local machine
ssh -i ~/.ssh/id_ed25519_hetzner_ex44 -L 8084:localhost:8084 -N root@157.180.7.100

# Then open http://localhost:8084/wiki/Main_Page in your browser
```

### Common Commands

```bash
# Start all wikis
docker compose up -d

# Start a single wiki
docker compose up -d mediawiki-vanipedia nginx-vanipedia

# Stop all wikis
docker compose down

# Rebuild the Docker image (after Dockerfile changes)
docker compose build && docker compose up -d

# View logs
docker logs mediawiki-vanipedia 2>&1 | tail -20

# Run a maintenance script (MW 1.43 syntax — NO .php suffix!)
docker exec mediawiki-vanipedia php /var/www/html/w/maintenance/run.php update --quick

# SMW setupStore (REQUIRED after any container recreation)
docker exec mediawiki-vanipedia php /var/www/html/w/extensions/SemanticMediaWiki/maintenance/setupStore.php
```

## Testing

The test suite validates all 8 wikis across 16 test categories:

```bash
# Test all wikis
./tests/run-all-tests.sh

# Test a single wiki
./tests/run-all-tests.sh vanipedia

# Test specific wikis
./tests/run-all-tests.sh vanisource vaniquotes
```

Test categories: HTTP health, API meta, API query, special pages, page rendering, VaniSkin, DB integrity, security, images, namespaces, cache/performance, SMW, Docker, feeds, error handling, and per-wiki extension checks.

## Secrets Management

Secrets are managed via a `.env` file (gitignored) at the repo root. Use `.env.example` as a template:

- `MW_DB_PASSWORD` — MariaDB password
- `MW_SECRET_KEY_<WIKI>` — Per-wiki MediaWiki secret key (generate with `openssl rand -hex 32`)
- `MW_ENV_DB_USER` / `MW_ENV_DB_PASS` — Credentials for custom extension DB connections

Some wikis (vanipedia, vanitest) also have `env/<wiki>.env.php` files that provide DB credentials to custom extensions with `db_connect.inc` files. These reference environment variables from `.env`.

## Documentation

| Document | Description |
|----------|-------------|
| [Migration Summary](docs/migration-summary.md) | Executive overview of all 8 wiki migrations |
| [Operations Guide](docs/operations.md) | Day-to-day ops: start/stop, maintenance, troubleshooting |
| [CLAUDE.md](CLAUDE.md) | Lessons learned — reference for AI-assisted coding sessions |
| [Per-wiki reports](docs/) | `migration-<wiki>.md` — detailed report for each wiki |

## Known Issues / Remaining Items

**Must-do:**
- **Vaniquotes refreshLinks** — `templatelinks` table was rebuilt empty; run `refreshLinks` to repopulate
- **SMW setupStore** — Required after any container recreation for SMW-enabled wikis

**Nice-to-have:**
- **vp_search / vp_translate databases** — Not yet migrated from old server; needed for vanipedia/vanitest custom admin extensions
- **Google Analytics** — Commented out across all wikis; needs GA4 property ID
- **Shared uploads URL** — vanibooks/vanictionary/vaniversity use internal Docker URL; update to production URL when DNS is pointed
