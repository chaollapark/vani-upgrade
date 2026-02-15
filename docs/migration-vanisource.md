# Vanisource Migration Report

## Overview
- **Source version:** MediaWiki 1.40.0
- **Target version:** MediaWiki 1.43.0 LTS
- **Port:** 8082
- **Database:** vanisource (prefix: vanisource_)
- **Pages:** 68,284
- **Skin:** VaniSkin (custom)
- **Status:** Complete (first wiki upgraded)

## What Was Done

### 1. Docker Infrastructure
- Created shared Dockerfile: MW 1.43 + PHP 8.2-FPM + SMW 5.x via Composer
- Set up shared-net Docker network connecting to mariadb-prod (port 3307)
- Configured memcached container

### 2. LocalSettings.php
Complete rewrite from original config:
- Removed all deprecated MW settings
- Updated DB connection to mariadb-prod
- Added memcached config
- Converted all `require_once` to `wfLoadExtension`
- Added ForeignAPIRepo for vanimedia shared uploads

### 3. Legacy Extension Migration (3 extensions)
**VaniAudio:** Created extension.json wrapper with parser hook registration
**VaniVideo:** Created extension.json wrapper
**MarkTerms:** Created extension.json wrapper

### 4. VaniSkin Fixes (5 issues, reused across all VaniSkin wikis)
1. Removed `var_dump($text)` debug statement in menu loading
2. Fixed `$_SERVER['SERVER_NAME']` regex — fails on localhost, added fallback
3. Replaced `Hooks::run` with `HookContainer::run` (MW 1.43 API change)
4. Removed `jquery.cookie` dependency from skin.json (removed in MW 1.43)
5. Changed menu.dat loading to use local file instead of fetching from vanipedia.org (Cloudflare blocks)

### 5. Non-Bundled Extensions Discovered
CharInsert and Renameuser are NOT bundled in MW 1.43 (were bundled in older versions). Had to copy from vani-mirror.

### 6. SMW Setup
- MW 1.43 requires SMW 5.x (not 4.x)
- Installed via Composer in Dockerfile
- Required `setupStore.php` after every container recreation

## Hard Parts
- **VaniSkin debugging:** Multiple issues to find and fix (var_dump, Hooks API, jquery.cookie, menu loading)
- **SMW version mismatch:** SMW 4.x uses `DB_MASTER` constant removed in MW 1.43 — had to use SMW 5.x
- **Composer security advisory:** PHPUnit advisory blocks `composer update` — needed `audit.block-insecure false` workaround
- **CharInsert/Renameuser not bundled:** Unexpected — these were bundled in older MW

## Considerations
- This was the first wiki upgraded and established all the patterns used for subsequent wikis
- The fixed VaniSkin serves as the template for all other VaniSkin wikis
- SMW setupStore must be re-run after any container recreation
