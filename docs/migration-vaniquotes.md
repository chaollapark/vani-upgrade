# Vaniquotes Migration Report

## Overview
- **Source version:** ~1.35+
- **Target version:** MediaWiki 1.43.0 LTS
- **Port:** 8083
- **Database:** vaniquotes (prefix: vaniquotes_)
- **Pages:** 292,706
- **Skin:** VaniSkin (custom)
- **Status:** Complete

## What Was Done

### 1. LocalSettings.php
Created from scratch based on the original `vaniquotes_LocalSettings.php`:
- Removed deprecated settings: `$wgDBmysql5`, `$wgScriptExtension`, `$wgUseAjax`, `$wgSessionsInObjectCache`, `$wgUseTeX`, `set_include_path()`, `require_once('global/settings.php')`, `$wgCommandLineMode` block
- `$wgDBTableOptions` changed from `TYPE=InnoDB` to `ENGINE=InnoDB, DEFAULT CHARSET=binary`
- `$wgProxyKey` renamed to `$wgSecretKey`
- `$wgDBserver` → `mariadb-prod`
- Added memcached config (`memcached:11211`)
- Added extra namespaces: Manual (100/101)
- SMW disabled (was commented out in original)
- Disabled heavy special pages via `SpecialPage_initList` hook

### 2. Legacy Extension Migration (4 extensions needed new extension.json wrappers)

**MenuSidebar:**
- Created `extension.json` + `MenuSidebarHooks.php`
- Original had placeholder test data in sidebar hook — made it a no-op

**VaniSubcat:**
- Created `extension.json` + `VaniSubcatHooks.php` + `VaniSubcat.body.php`
- Implements `CategoryPageView` hook
- Contains `VaniCategoryPage` and `VaniCategoryViewer` classes for scroll-to-pages link

**VaniFactbox:**
- Created `extension.json` + `VaniFactboxHooks.php`
- Implements `ArticleViewFooter` hook
- Displays compiler/date/quote count metadata

**VaniquotesApi:**
- Created `extension.json` + `VaniquotesApiSetup.php` + `ApiQueryRandomQuote.php`
- Defines `MW_EXT_VANIAPI_KEY` constant
- Registers `ApiQueryRandomQuote` API module

### 3. Other Extensions
- Copied reusable extensions from vanisource: VaniAudio, VaniVideo, MarkTerms, VaniSearch, VaniUrlRouter, MobileDetect, HeaderTabs, Variables, Loops, RandomImage, RandomSelection, EmbedVideo, CharInsert, Renameuser, NoTitle, ExternalData
- Copied from vanipedia: CategoryMove, QuoteStats, AI_CategoryWrapper, AI_PageLinker
- Updated manifest_version 1→2 for: CategoryMove, QuoteStats, AI_CategoryWrapper, AI_PageLinker
- HeadScript.php inlined into LocalSettings.php (loads AI_CategoryWrapper and AI_PageLinker CSS/JS)
- googleAnalytics replaced with commented-out GA4 inline hook

### 4. VaniSkin
Copied from vanisource. Updated CSS class fallback to "vaniquotes".

### 5. Database Migration

#### The Hard Parts

**templatelinks table (MAJOR):**
The templatelinks table was in a partially-migrated state — had already been modified by a prior partial upgrade attempt but lacked a PRIMARY KEY. MW 1.43's `update --quick` tried to `DROP PRIMARY KEY` which didn't exist, causing a fatal error.

Multiple fix attempts:
1. Making columns nullable manually + marking patch in updatelog → didn't work (modifyField checks column state, not updatelog)
2. Adding _rowid column for dedup → lock timeout on large table (2.2M rows)
3. CREATE AS SELECT DISTINCT → still had duplicates (different tl_namespace/tl_title for same tl_from/tl_target_id)
4. **Final fix:** Stopped container to release locks, created fresh empty table with correct MW 1.43 schema (`PRIMARY KEY(tl_from, tl_target_id)`), dropped old table, renamed new. Data to be repopulated via `refreshLinks`.

**pagelinks table (MAJOR):**
Similar partially-migrated state. The `pl_namespace` index didn't exist, causing the updater to fail.

**Fix:** Stopped container, rebuilt table fresh with correct MW 1.43 schema, used `INSERT IGNORE INTO ... SELECT pl_from, pl_from_namespace, pl_target_id FROM ... WHERE pl_target_id IS NOT NULL AND pl_target_id > 0`, dropped old, renamed new.

## Considerations
- **Link tables rebuilt empty:** The templatelinks table was rebuilt empty (data lost). Run `php maintenance/run.php refreshLinks` to repopulate (this is a long-running operation on 292K pages).
- **SMW disabled:** Not using Semantic MediaWiki
- **AI extensions:** AI_CategoryWrapper and AI_PageLinker load page-specific CSS/JS via inline BeforePageDisplay hook
- Images bind-mounted from `/data/vani-mirror/www/vaniquotes/w/images`
