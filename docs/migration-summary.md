# Vani Wiki Migration Summary

## All 8 wikis upgraded to MediaWiki 1.43.0 LTS

| Wiki | Port | Source MW | Pages | Skin | Extensions | Status |
|------|------|-----------|-------|------|------------|--------|
| vanisource | 8082 | 1.40.0 | 68,284 | VaniSkin | 18 | Complete |
| vaniquotes | 8083 | ~1.35+ | 292,706 | VaniSkin | 24 | Complete |
| vanipedia | 8084 | ~1.35+ | 136,464 | VaniSkin | 46 | Complete |
| vanitest | 8085 | ~1.35+ | 134,618 | VaniSkin | 46 | Complete |
| vanimedia | 8086 | ~1.35+ | 20,679 | VaniSkin | 10 | Complete |
| vanibooks | 8087 | 1.23.5 | 35 | Vector | 11 | Complete |
| vanictionary | 8088 | 1.23.5 | 44 | Vector | 9 | Complete |
| vaniversity | 8089 | 1.23.5 | 36 | Vector | 9 | Complete |

## Architecture

All wikis share:
- **Dockerfile:** MW 1.43 + PHP 8.2-FPM + SMW 5.x (Composer)
- **Database:** mariadb-prod (shared MariaDB on port 3307)
- **Cache:** memcached (shared, 128MB)
- **Network:** shared-net (Docker network)
- **Images:** Bind-mounted from `/data/vani-mirror/www/<wiki>/w/images`

Each wiki has:
- `mediawiki-<wiki>` — PHP-FPM container
- `nginx-<wiki>` — Nginx reverse proxy on assigned port

## Key Challenges Encountered

### 1. MW 1.23.5 → 1.43 Direct Upgrade Not Supported
MW 1.43 requires at least MW 1.35 as the source version. Vanictionary and vaniversity needed a **two-step migration**: MW 1.23.5 → MW 1.39 (via `mediawiki:1.39-fpm` Docker image) → MW 1.43.

### 2. Missing/Broken ipblocks Table
The MW 1.23.5 databases were missing the `ipblocks` table entirely. The MW 1.39 updater crashed when trying to modify it. Required manual table creation with correct schema including `ipb_reason_id` column.

### 3. Partially-Migrated Link Tables (vaniquotes)
The templatelinks and pagelinks tables had been partially upgraded by a prior attempt, leaving them in an inconsistent state (missing primary keys, missing indexes). Had to rebuild these tables from scratch with the correct MW 1.43 schema.

### 4. VaniSkin Fixes
5 issues found and fixed in VaniSkin for MW 1.43 compatibility:
- Removed var_dump debug statement
- Fixed SERVER_NAME regex for localhost
- Replaced deprecated Hooks::run with HookContainer::run
- Removed deleted jquery.cookie dependency
- Changed menu.dat to local file loading

### 5. Legacy Extension Migration
7 extensions needed new extension.json wrappers:
- VaniAudio, VaniVideo, MarkTerms (vanisource)
- MenuSidebar, VaniSubcat, VaniFactbox, VaniquotesApi (vaniquotes)

6 extensions needed manifest_version 1→2 config format updates (vanipedia).

### 6. Deprecated Settings Removed Across All Wikis
- `$wgDBmysql5`, `$wgScriptExtension`, `$wgUseAjax`, `$wgUseTeX`
- `$wgSessionsInObjectCache`, `$wgProxyKey` (→ `$wgSecretKey`)
- `set_include_path()`, `$wgCommandLineMode` blocks
- `require_once("$IP/includes/DefaultSettings.php")`
- `$wgDBTableOptions = "TYPE=InnoDB"` → `"ENGINE=InnoDB, DEFAULT CHARSET=binary"`

## Remaining Items

### Must-Do
- **Vaniquotes refreshLinks:** templatelinks table was rebuilt empty — run `php maintenance/run.php refreshLinks` to repopulate
- **SMW setupStore:** Required after any container recreation for SMW-enabled wikis (vanisource, vanitest, vanipedia)

### Nice-to-Have
- **vp_search/vp_translate databases:** Not migrated from old server — needed for vanipedia/vanitest custom admin extensions
- **Google Analytics:** Commented out across all wikis — needs GA4 property ID
- **Shared uploads URL:** vanibooks/vanictionary/vaniversity use internal Docker URL (`http://nginx-vanimedia/w/api.php`) — update to production URL when DNS is pointed

## Per-Wiki Migration Documents

Detailed reports for each wiki are in:
- `docs/migration-vanisource.md`
- `docs/migration-vaniquotes.md`
- `docs/migration-vanipedia.md`
- `docs/migration-vanitest.md`
- `docs/migration-vanimedia.md`
- `docs/migration-vanibooks.md`
- `docs/migration-vanictionary.md`
- `docs/migration-vaniversity.md`
