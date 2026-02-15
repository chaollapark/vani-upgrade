# Vanipedia Migration Report

## Overview
- **Source version:** ~1.35+
- **Target version:** MediaWiki 1.43.0 LTS
- **Port:** 8084
- **Database:** vanipedia (prefix: vanipedia_)
- **Pages:** 136,464
- **Revisions:** 255,450
- **Images:** 1,429 files (19GB bind-mounted)
- **Skin:** VaniSkin (custom)
- **Status:** Complete

## What Was Done

### 1. LocalSettings.php
Created from scratch based on original `vanipedia_LocalSettings.php`:
- Removed deprecated settings: `$wgDBmysql5`, `$wgScriptExtension`, `$wgUseAjax`, `$wgSessionsInObjectCache`, `$wgUseTeX`, `set_include_path()`, `$wgCommandLineMode` block
- `$wgDBTableOptions` → `ENGINE=InnoDB, DEFAULT CHARSET=binary`
- `$wgProxyKey` → `$wgSecretKey`
- `$wgDBserver` → `mariadb-prod`
- Added memcached config (`memcached:11211`)
- All `require_once` extensions converted to `wfLoadExtension`
- HeadScript.php converted to inline `$wgHooks['BeforePageDisplay'][]` closure
- googleAnalytics replaced with commented-out GA4 inline hook
- Removed broken `$mobile = mobiledetect()` call

### 2. Extensions (46 total)
This wiki has the largest extension set of all 8 wikis.

**Legacy extensions migrated (4 needed new extension.json wrappers):**
- **IframePage** — Created extension.json wrapper
- **FactBox** — Created extension.json + FactBoxHooks.php (hook class extraction)
- **VanipediaApi** — Created extension.json + VanipediaApiSetup.php
- **HeadScript** — Converted to inline `BeforePageDisplay` closure (not a separate extension)

**manifest_version 1→2 fixes (6 extensions):**
- VaniNavigation, ImportArticles, TranPropAdmin, NDropTranslation, GoogleDocs4MW, GoogleSiteSearch
- GoogleSiteSearch also needed config format fix (`bare value` → `{value, description}` object)

**Custom extensions with db_connect files (12 extensions):**
- VideoShorts, NDropTranslation, NDropStatistics, CPStatistics, CategoryAdmin, LangAdmin, UserAdmin, UserSeva, RevisionManager, SearchAdmin, QuotesAdmin, TranPropAdmin
- All `db_connect.inc`/`.php` files updated: `$host = "localhost"` → `$host = "mariadb-prod"`
- Created `vanipedia.env.php` with DB credentials, mounted at `/var/www/vanipedia/vanipedia.env.php`

**Extensions requiring nginx static asset mounting (20 extensions):**
Extensions that load CSS/JS via direct `<link>`/`<script>` tags (outside ResourceLoader) need their directories mounted in the nginx container too.

### 3. VaniSkin
Copied from vanisource (already fixed). CSS class fallback set to "vanipedia".

### 4. Database Migration
- `update --quick` completed successfully
- SMW setupStore completed

## Hard Parts
- **46 extensions:** Largest extension set — many needed individual attention (manifest_version fixes, db_connect updates, extension.json wrappers)
- **manifest_version 1→2 config format:** Bare values in config section cause fatal `array_key_exists()` error. Must wrap in `{value, description}` objects.
- **Custom extension DB connections:** 12 extensions with `db_connect.inc`/`.php` files all needed hostname changes from `localhost` to `mariadb-prod`
- **Nginx static asset serving:** Extensions with CSS/JS loaded via direct HTML tags (not ResourceLoader) need their directories mounted in both the mediawiki AND nginx containers
- **SMW schema key invalidation:** Any container recreation invalidates the SMW upgrade key in memcached — must re-run setupStore.php every time

## Considerations
- **Custom databases not migrated:** `vp_search` and `vp_translate` databases exist on the old server but not yet on mariadb-prod. Extensions that use these (SearchAdmin, CategoryAdmin, LangAdmin, CPStatistics, NDropStatistics, ExternalData, UserAdmin, UserSeva, RevisionManager, QuotesAdmin, NDropTranslation, VideoShorts) will load but show DB errors when queried.
- **VaniSearch static assets:** Incomplete — some search-related assets may not load correctly
- **Google Analytics:** Commented out pending GA4 property setup
- **Images:** 19GB bind-mounted from `/data/vani-mirror/www/vanipedia/w/images`
- **Vanitest is a clone:** Vanitest (port 8085) is an exact mirror of vanipedia with only DB name/port/sitename changed
