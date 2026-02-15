# Vanictionary Migration Report

## Overview
- **Source version:** MediaWiki 1.23.5
- **Target version:** MediaWiki 1.43.0 LTS
- **Port:** 8088
- **Database:** vanictionary (prefix: vanictionary_)
- **Pages:** 44
- **Skin:** Vector (bundled)
- **Status:** Complete

## What Was Done

### 1. LocalSettings.php
Created from scratch based on original `vanictionary_LocalSettings.php`:
- Removed deprecated settings: `$wgDBmysql5`, `$wgScriptExtension`, `$wgSessionsInObjectCache`, `$wgUseTeX`, `set_include_path()`, `require_once("$IP/includes/DefaultSettings.php")`, `$wgCommandLineMode` block, Postgres settings
- `$wgDBTableOptions` → `ENGINE=InnoDB, DEFAULT CHARSET=binary`
- `$wgProxyKey` → `$wgSecretKey`
- `$wgDBserver` → `mariadb-prod`
- Added memcached config
- Converted old-style shared uploads to `ForeignAPIRepo` pointing to `http://nginx-vanimedia/w/api.php`
- All `require_once` extensions converted to `wfLoadExtension`
- `HeadScript.php` (which loaded dropdown menu CSS/JS from vanipedia.org) converted to inline `$wgHooks['BeforePageDisplay'][]` closure
- Skipped: `require_once('global/settings.php')` (deprecated settings)
- Skipped: Mantle extension (obsolete)

### 2. Extensions (9 total)
**Bundled in MW 1.43 (no copy needed):**
- CategoryTree, ImageMap, InputBox, Interwiki, ParserFunctions

**Non-bundled (copied from other upgraded wikis):**
- CharInsert, Loops, RandomSelection, EmbedVideo

### 3. Database Migration — Two-Step Process

#### The Hard Part: MW 1.23.5 → 1.43 Direct Upgrade Not Supported

MW 1.43's updater refuses to upgrade databases older than MW 1.35. The error:
```
Can not upgrade from versions older than 1.35, please upgrade to that version or later first.
```

**Solution: Intermediate MW 1.39 upgrade**
1. Pulled official `mediawiki:1.39-fpm` Docker image
2. Created minimal LocalSettings.php connecting to mariadb-prod
3. Ran `maintenance/update.php --quick` via MW 1.39

**Additional complications during MW 1.39 intermediate step:**

**Missing ipblocks table:**
The original MW 1.23.5 database was missing the `ipblocks` table entirely (it had been removed or never populated). The MW 1.39 updater crashed when trying to run `doFixIpbAddressUniqueIndex()`.

Fix: Manually created the `ipblocks` table with MW 1.23 base schema, then added the `ipb_reason_id` column that later migration steps expected.

**Missing revision_comment_temp table:**
After the MW 1.39 update completed all schema changes, it crashed during the post-update message formatting when trying to query `revision_comment_temp`. This turned out to be cosmetic — the schema migration itself completed successfully.

4. After MW 1.39 brought the schema up to date, the MW 1.43 `update --quick` completed successfully

## Hard Parts
1. **Two-step migration required:** MW 1.23.5 → MW 1.39 (intermediate) → MW 1.43 (final)
2. **Missing ipblocks table:** Had to manually create with correct schema including columns expected by the MW 1.39 updater
3. **ipb_reason_id column ordering:** The MW 1.39 updater tried to drop `ipb_reason` before `ipb_reason_id` existed, requiring manual column addition between retry attempts

## Considerations
- **Tiny wiki:** Only 44 pages
- **Vector skin:** Uses default Vector skin
- **Shared uploads from vanimedia:** ForeignAPIRepo to nginx-vanimedia
- **Dropdown menus:** HeadScript loads CSS/JS from vanipedia.org — depends on vanipedia.org being accessible
- **Skipped extensions:** Mantle (obsolete)
