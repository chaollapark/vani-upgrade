# Vanitest Migration Report

## Overview
- **Source version:** ~1.35+ (mirror of vanipedia)
- **Target version:** MediaWiki 1.43.0 LTS
- **Port:** 8085
- **Database:** vanitest (prefix: vanitest_)
- **Pages:** 134,618
- **Skin:** VaniSkin (custom)
- **Status:** Complete

## What Was Done

### 1. Configuration (copied from vanipedia)
Vanitest is an exact mirror of vanipedia. All configuration was copied from the completed vanipedia upgrade with these changes:
- `$wgSitename` → "Vanitest"
- `$wgServer` → `http://localhost:8085`
- `$wgDBname` → "vanitest"
- `$wgDBprefix` → "vanitest_"
- Email contacts → vanitest.org domain
- SMW enableSemantics → vanitest.org

### 2. Extensions (46 total, same as vanipedia)
All extensions copied from vanipedia directory — no modifications needed since they were already MW 1.43 compatible.

### 3. Custom Extension Environment Files
- Created `vanitest.env.php` with DB credentials
- Updated all 12 `db_connect.inc`/`.php` files in custom extensions to reference `/var/www/vanitest/vanitest.env.php` instead of vanipedia's path

### 4. VaniSkin
Copied from vanipedia. Updated CSS class fallback from "vanipedia" to "vanitest" in `VaniSkin.skin.php`.

### 5. Database Migration
- `update --quick` ran successfully (5 min 22 s)
- SMW setupStore completed

## Hard Parts
None — this was the simplest upgrade since it's a direct copy of the already-completed vanipedia configuration.

## Considerations
- Vanitest shares the same extension set as vanipedia (46 extensions)
- The custom databases (vp_search, vp_translate) are not migrated (same as vanipedia)
- Images bind-mounted from `/data/vani-mirror/www/vanitest/w/images`
