# Vanimedia Migration Report

## Overview
- **Source version:** ~1.35+
- **Target version:** MediaWiki 1.43.0 LTS
- **Port:** 8086
- **Database:** vanimedia (prefix: vanimedia_)
- **Pages:** 20,679
- **Skin:** VaniSkin (custom)
- **Status:** Complete

## What Was Done

### 1. LocalSettings.php
Created from scratch based on original `vanimedia_LocalSettings.php`:
- Removed deprecated settings: `$wgDBmysql5`, `$wgScriptExtension`, `$wgUseAjax`, `$wgSessionsInObjectCache`, `$wgUseTeX`, `set_include_path()`, `$wgCommandLineMode` block
- `$wgDBTableOptions` → `ENGINE=InnoDB, DEFAULT CHARSET=binary`
- `$wgProxyKey` → `$wgSecretKey`
- `$wgDBserver` → `mariadb-prod`
- Added memcached config
- Preserved `$wgHashedUploadDirectory = true` (unique among wikis)
- Preserved extra namespaces: Tools (102), Tools_talk (103)
- `$wgUploadSizeWarning = 0` preserved
- No SMW, no ForeignFileRepos (this IS the media wiki)
- All `require_once` extensions converted to `wfLoadExtension`
- googleAnalytics replaced with commented-out GA4 inline hook
- Removed broken `$mobile = mobiledetect()` call

### 2. Extensions
Copied from vanisource/vaniquotes (all already MW 1.43 compatible):
- VaniAudio, MobileDetect, VaniSearch, HeaderTabs, Loops, RandomImage, RandomSelection, EmbedVideo, CharInsert, Renameuser

### 3. VaniSkin
Copied from vanisource. Updated CSS class fallback to "vanimedia".

### 4. Database Migration
- `update --quick` completed successfully with no issues
- Schema migration was straightforward (no partially-migrated tables)

## Hard Parts
- **Docker-compose duplicate:** The vanimedia service already existed in a prior state of docker-compose.yml from an earlier attempt. Adding it again caused a duplicate key error. Fixed by removing the second copy.
- **cp alias:** The system had `cp` aliased to `cp -i` (interactive), causing prompts during file copying. Fixed by using `/bin/cp` explicitly.

## Considerations
- **Large images:** 22GB of images bind-mounted from `/data/vani-mirror/www/vanimedia/w/images` — not copied
- **Hashed upload directory:** `$wgHashedUploadDirectory = true` — images are stored in subdirectories (e.g., `images/a/ab/file.jpg`)
- **Central media wiki:** This is the shared media repository for vanibooks, vanictionary, and vaniversity (they reference it via ForeignAPIRepo)
