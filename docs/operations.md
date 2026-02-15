# Operations Guide

Day-to-day operations reference for the Vani wiki infrastructure. For architecture overview, see [README.md](../README.md). For migration history, see [migration-summary.md](migration-summary.md).

## Starting and Stopping

```bash
# Start all wikis
docker compose up -d

# Start a single wiki (both PHP-FPM and nginx containers)
docker compose up -d mediawiki-vanipedia nginx-vanipedia

# Stop all wikis
docker compose down

# Restart a single wiki
docker compose restart mediawiki-vanipedia nginx-vanipedia

# Rebuild the Docker image (after Dockerfile changes)
docker compose build && docker compose up -d
```

**CRITICAL:** After any container recreation (`docker compose up -d` after config changes), re-run SMW `setupStore.php` for SMW-enabled wikis (vanisource, vanipedia, vanitest). Without this, all pages will show the `ERROR_SCHEMA_INVALID_KEY` error. See [Troubleshooting](#troubleshooting) for details.

```bash
docker exec mediawiki-vanipedia php /var/www/html/w/extensions/SemanticMediaWiki/maintenance/setupStore.php
```

## Maintenance Scripts

### MW 1.43 Syntax

In MW 1.43, `maintenance/run.php` is the entry point. Pass script names **without** the `.php` suffix:

```bash
# Correct
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php update --quick

# Wrong — silently exits with code 255
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php update.php --quick
```

### Common Scripts

```bash
# Schema upgrade (run after MW version changes)
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php update --quick

# SMW store setup (run after container recreation or memcached flush)
docker exec mediawiki-<wiki> php /var/www/html/w/extensions/SemanticMediaWiki/maintenance/setupStore.php

# Rebuild search index and link tables
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php rebuildall

# Refresh link tables (needed if templatelinks/pagelinks are stale)
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php refreshLinks

# Site stats (fix page counts)
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php initSiteStats --update
```

### Database Queries

```bash
# Connect to MariaDB
docker exec -it mariadb-prod mariadb -u admin -p

# Page count for a wiki
docker exec mariadb-prod mariadb -u admin -p"$MW_DB_PASSWORD" vanisource_db \
  -e "SELECT COUNT(*) FROM vanisource_page"
```

## Health Checks

### Quick Checks

```bash
# HTTP status (expect 200)
curl -s -o /dev/null -w '%{http_code}' http://localhost:8084/wiki/Main_Page

# 404 handling (expect 404, not 500)
curl -s -o /dev/null -w '%{http_code}' -L http://localhost:8084/wiki/NonExistent

# MediaWiki version
curl -s http://localhost:8084/wiki/Special:Version | grep 'MediaWiki 1.43'

# API siteinfo
curl -s 'http://localhost:8084/w/api.php?action=query&meta=siteinfo&format=json' | python3 -m json.tool | head -5

# List loaded extensions
curl -s 'http://localhost:8084/w/api.php?action=query&meta=siteinfo&siprop=extensions&format=json' \
  | python3 -c "import sys,json; exts=json.load(sys.stdin)['query']['extensions']; [print(e['name']) for e in exts]"

# SMW status (expect 0 errors)
curl -s http://localhost:8084/wiki/Special:SemanticMediaWiki | grep -c 'error\|Error'
```

### Full Test Suite

```bash
# All 8 wikis — 16 test categories per wiki
./tests/run-all-tests.sh

# Single wiki
./tests/run-all-tests.sh vanipedia
```

## SSH Access

```bash
# Hetzner server
ssh -i ~/.ssh/id_ed25519_hetzner_ex44 root@157.180.7.100

# Old Vani server (reference only)
ssh vani
```

### SSH Tunnel for Browser Testing

Forward a wiki's port to your local machine:

```bash
ssh -i ~/.ssh/id_ed25519_hetzner_ex44 -L <port>:localhost:<port> -N root@157.180.7.100
```

Port assignments:

| Port | Wiki |
|------|------|
| 8082 | vanisource |
| 8083 | vaniquotes |
| 8084 | vanipedia |
| 8085 | vanitest |
| 8086 | vanimedia |
| 8087 | vanibooks |
| 8088 | vanictionary |
| 8089 | vaniversity |

## Troubleshooting

### 500 / Blank Page

1. Check PHP-FPM logs: `docker logs mediawiki-<wiki> 2>&1 | tail -30`
2. Check nginx logs: `docker logs nginx-<wiki> 2>&1 | tail -30`
3. Verify container status: `docker ps | grep <wiki>`
4. Enable debug in LocalSettings.php: `$wgShowExceptionDetails = true;`

### SMW ERROR_SCHEMA_INVALID_KEY

This occurs when the SMW upgrade key in memcached is stale (typically after container recreation or `memcached flush_all`).

```bash
docker exec mediawiki-<wiki> php /var/www/html/w/extensions/SemanticMediaWiki/maintenance/setupStore.php
```

### Extension Not Loading

1. Verify the extension directory is mounted: `docker exec mediawiki-<wiki> ls /var/www/html/w/extensions/<ExtName>/`
2. Check for `extension.json`: `docker exec mediawiki-<wiki> cat /var/www/html/w/extensions/<ExtName>/extension.json | head -5`
3. Verify via API: `curl -s 'http://localhost:<port>/w/api.php?action=query&meta=siteinfo&siprop=extensions&format=json' | python3 -c "import sys,json; [print(e['name']) for e in json.load(sys.stdin)['query']['extensions']]" | grep <ExtName>`

### Extension CSS/JS Returns 404

Extensions with static assets loaded via direct `<link>`/`<script>` tags (not ResourceLoader) need their directories mounted in the **nginx** container too, not just the mediawiki container. Add a read-only volume mount in the nginx service in `docker-compose.yml`.

### Maintenance Script Exits 255

You used the `.php` suffix. In MW 1.43, pass script names without it:

```bash
# Wrong:  run.php update.php --quick
# Right:  run.php update --quick
```

### Memcached Issues

- MediaWiki uses its own socket-based memcached client — the PHP `Memcached` extension is NOT needed
- Config: `$wgMemCachedServers = ['memcached:11211']`
- After any `flush_all` on memcached, **re-run SMW setupStore.php** or SMW will error
- To restart: `docker compose restart memcached` (then re-run setupStore for SMW wikis)

## Backups

### Locations

| Path | Contents |
|------|----------|
| `/data/vani-mirror/www/<wiki>/` | Original wiki files (images, extensions, skins) |
| `/data/vani-mirror/db-dumps/` | Database backups for all wikis |
| `/data/vani-mirror/config/` | Original LocalSettings.php backups |

### Manual Backup

```bash
# Database dump
docker exec mariadb-prod mariadb-dump -u admin -p"$MW_DB_PASSWORD" <dbname> > /data/backups/<dbname>-$(date +%F).sql

# File backup
cp -a /data/vani-upgrade/<wiki>/ /data/backups/<wiki>-$(date +%F)/
```

## Adding a New Wiki

1. **Create directory structure:**

```
/data/vani-upgrade/<wiki>/
├── LocalSettings.php
├── global/
│   └── permissions.php
├── extensions/          # Custom/non-bundled extensions
├── skins/VaniSkin/      # If VaniSkin wiki
├── env/<wiki>.env.php   # If custom extensions need DB creds
└── menu.dat             # If VaniSkin wiki
```

2. **Add services to `docker-compose.yml`** — copy an existing wiki's mediawiki + nginx service pair and update:
   - Container names
   - Volume mounts (LocalSettings, extensions, skins)
   - Port number
   - `fastcgi_pass` in the nginx config

3. **Create nginx config** — copy `nginx/vanisource.conf` and change `fastcgi_pass` to `mediawiki-<wiki>:9000`

4. **LocalSettings.php checklist:**
   - `$wgDBserver` → `"mariadb-prod"`
   - `$wgServer` → `"http://localhost:<port>"`
   - `$wgMemCachedServers` → `['memcached:11211']`
   - Remove deprecated settings (`$wgDBmysql5`, `$wgScriptExtension`, `$wgUseAjax`)
   - `$wgProxyKey` → `$wgSecretKey`
   - Replace all `require_once` with `wfLoadExtension`

5. **Post-start:**
   - Run `update --quick` for schema migration
   - Run `setupStore.php` if SMW is enabled
   - Run the test suite: `./tests/run-all-tests.sh <wiki>`

## Adding / Modifying Extensions

### Bundled vs Non-Bundled

Extensions bundled in the MW 1.43 tarball are already in the Docker image. Non-bundled extensions must be placed in `<wiki>/extensions/<ExtName>/` and mounted as volumes.

Extensions that were bundled in older MW but are **not** in 1.43 (must be copied):
- CharInsert
- Renameuser

### Legacy Extension Migration

Extensions using `require_once` need an `extension.json` wrapper:

```json
{
    "name": "ExtensionName",
    "version": "1.0",
    "type": "parserhook",
    "requires": { "MediaWiki": ">= 1.39.0" },
    "AutoloadClasses": {
        "ExtensionNameClass": "ExtensionName.body.php"
    },
    "Hooks": {
        "ParserFirstCallInit": "ExtensionNameClass::onParserFirstCallInit"
    },
    "manifest_version": 2
}
```

Also convert `$messages` arrays in `.i18n.php` files to JSON in `i18n/en.json`.

### manifest_version 1 to 2

When upgrading to `manifest_version: 2`, the `config` section format changes:

```json
// manifest_version 1 (bare values):
"config": { "MyKey": "" }

// manifest_version 2 (value/description objects):
"config": { "MyKey": { "value": "", "description": "What it does" } }
```

Bare values cause a fatal error: `array_key_exists(): Argument #2 must be of type array`.

### Custom Extension DB Connections

Extensions with `db_connect.inc` / `db_connect.php` files need:

1. Create `env/<wiki>.env.php` with DB credentials
2. Mount at `/var/www/<wiki>/<wiki>.env.php:ro` in docker-compose.yml
3. Update all `db_connect` files: `$host = "localhost"` → `$host = "mariadb-prod"`
