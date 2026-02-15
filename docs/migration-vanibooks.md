# Vanibooks Migration Report

## Overview
- **Source version:** MediaWiki 1.23.5
- **Target version:** MediaWiki 1.43.0 LTS
- **Port:** 8087
- **Database:** vanibooks (prefix: vanibooks_)
- **Pages:** 35
- **Skin:** Vector (bundled)
- **Status:** Complete

## What Was Done

### 1. LocalSettings.php
Created from scratch based on original `vanibooks_LocalSettings.php`:
- Removed deprecated settings: `$wgDBmysql5`, `$wgScriptExtension`, `$wgSessionsInObjectCache`, `$wgUseTeX`, `set_include_path()`, `require_once("$IP/includes/DefaultSettings.php")`, `$wgCommandLineMode` block, Postgres settings
- `$wgDBTableOptions` → `ENGINE=InnoDB, DEFAULT CHARSET=binary`
- `$wgProxyKey` → `$wgSecretKey`
- `$wgDBserver` → `mariadb-prod`
- Added memcached config
- Converted old-style shared uploads (`$wgUseSharedUploads`, `$wgSharedUploadPath`, etc.) to modern `$wgForeignFileRepos[]` with `ForeignAPIRepo` pointing to `http://nginx-vanimedia/w/api.php`
- All `require_once` extensions converted to `wfLoadExtension`
- HeadScript.php was already commented out in original; the inline `BeforePageDisplay` hook for hellobar + dropdown menus was preserved as a closure
- Skipped: `require_once('global/settings.php')` (contains deprecated settings)
- Skipped: Mantle extension (obsolete, was for MobileFrontend)

### 2. Extensions (11 total)
**Bundled in MW 1.43 (no copy needed):**
- CategoryTree, ImageMap, InputBox, Interwiki, ParserFunctions

**Non-bundled (copied from other upgraded wikis):**
- CharInsert, Loops, RandomImage, RandomSelection, EmbedVideo, IframePage

### 3. IframePage Configuration
Preserved original donation page iframe:
```php
$wgIframePageSrc = [
    'Donating to Vanipedia' => 'https://cdn.donately.com/...'
];
```

### 4. Database Migration
- `update --quick` completed successfully — MW jumped from 1.23.5 to 1.43.0 in one step
- The database had already been partially upgraded in a prior session (updatelog showed MW 1.43-style entries), which is why the direct 1.43 update worked

## Hard Parts
None — the database had already been pre-upgraded, so the schema migration was trivial. Extension set is small and all either bundled or already available from other wikis.

## Considerations
- **Tiny wiki:** Only 35 pages — this is a very small wiki
- **Vector skin:** Uses default Vector skin, no custom skin needed
- **Shared uploads from vanimedia:** Uses ForeignAPIRepo to access vanimedia images via internal Docker network URL (`http://nginx-vanimedia/w/api.php`)
- **Hellobar script:** Still references external hellobar.com — may want to remove if service is discontinued
- **Skipped extensions:** Mantle (obsolete MobileFrontend dependency)
