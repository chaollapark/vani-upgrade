# Vaniversity Migration Report

## Overview
- **Source version:** MediaWiki 1.23.5
- **Target version:** MediaWiki 1.43.0 LTS
- **Port:** 8089
- **Database:** vaniversity (prefix: vaniversity_)
- **Pages:** 36
- **Skin:** Vector (bundled)
- **Status:** Complete

## What Was Done

### 1. LocalSettings.php
Created from scratch based on original `vaniversity_LocalSettings.php`:
- Removed deprecated settings: `$wgDBmysql5`, `$wgScriptExtension`, `$wgSessionsInObjectCache`, `$wgUseTeX`, `set_include_path()`, `require_once("$IP/includes/DefaultSettings.php")`, `$wgCommandLineMode` block, Postgres settings
- `$wgDBTableOptions` → `ENGINE=InnoDB, DEFAULT CHARSET=binary`
- `$wgProxyKey` → `$wgSecretKey`
- `$wgDBserver` → `mariadb-prod`
- Added memcached config
- Converted old-style shared uploads to `ForeignAPIRepo` pointing to `http://nginx-vanimedia/w/api.php`
- All `require_once` extensions converted to `wfLoadExtension`
- Inline `BeforePageDisplay` hook for hellobar + dropdown menus preserved as closure
- Skipped: `require_once('global/settings.php')` (deprecated settings)

### 2. Extensions (9 total)
**Bundled in MW 1.43 (no copy needed):**
- CategoryTree, ImageMap, Interwiki, ParserFunctions, SyntaxHighlight_GeSHi

**Non-bundled (copied from other upgraded wikis):**
- CharInsert, RandomSelection, EmbedVideo, IframePage

### 3. Skipped Extensions (5 total)
These legacy extensions were deemed obsolete and intentionally not migrated:
- **Mantle** — Obsolete MobileFrontend dependency, no MW 1.43 compatible version
- **MailChimpForms** — Legacy email signup integration, likely defunct
- **Html5mediator** — Legacy HTML5 media player, superseded by modern browser capabilities
- **ContributionTracking** — Wikimedia donation system component, complex dependency chain
- **DonationInterface** — Wikimedia donation gateway, requires extensive configuration (Adyen, Amazon, Astropay, GlobalCollect, Worldpay, Stomp, Minfraud) — all with placeholder/empty credentials in original config

### 4. IframePage Configuration
Preserved original donation page iframe (same as vanibooks).

### 5. Database Migration — Two-Step Process

Same as vanictionary: MW 1.43 cannot upgrade directly from MW 1.23.5.

**Step 1:** Intermediate upgrade via `mediawiki:1.39-fpm` Docker image
- Same ipblocks table fix required (missing table + missing ipb_reason_id column)
- Same revision_comment_temp cosmetic error after completion

**Step 2:** MW 1.43 `update --quick` completed successfully

## Hard Parts
1. **Two-step migration:** MW 1.23.5 → MW 1.39 → MW 1.43 (same process as vanictionary)
2. **Missing ipblocks table:** Same fix as vanictionary — manual table creation with correct schema
3. **Many skipped extensions:** 5 extensions skipped — most were Wikimedia-specific donation/payment systems with complex dependencies that aren't relevant to this wiki's use case

## Considerations
- **Tiny wiki:** Only 36 pages
- **Vector skin:** Uses default Vector skin
- **Shared uploads from vanimedia:** ForeignAPIRepo to nginx-vanimedia
- **Hellobar + dropdown menus:** Loads external scripts from hellobar.com and vanipedia.org
- **SyntaxHighlight_GeSHi:** Original config referenced an absolute path (`/var/www/vaniversity/w/extensions/SyntaxHighlight_GeSHi/SyntaxHighlight_GeSHi.php`) — now loaded via `wfLoadExtension('SyntaxHighlight_GeSHi')` which uses the bundled version
- **Donation system removed:** The original had ContributionTracking + DonationInterface with placeholder credentials — these were non-functional and removed. If donation functionality is needed, consider using IframePage with the Donately embed (already configured)
