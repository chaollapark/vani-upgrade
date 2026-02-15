# Vani Wiki MediaWiki Upgrade Project

## Overview

Upgrading 8 Vani wikis from legacy MediaWiki to **MW 1.43 LTS** running in Docker on Hetzner. Vanisource and Vanipedia are complete. 6 wikis remain.

## SSH Access

- **Hetzner:** `ssh -i ~/.ssh/id_ed25519_hetzner_ex44 root@157.180.7.100`
- **Old Vani server (reference):** `ssh vani`

## Key Paths on Hetzner

| Path | Purpose |
|------|---------|
| `/data/vani-mirror/www/<wiki>/` | Original wiki files (read-only reference) |
| `/data/vani-mirror/db-dumps/` | Database backups for all wikis |
| `/data/vani-mirror/config/` | Original LocalSettings.php backups |
| `/data/vani-mirror/home/global/` | Shared permissions.php |
| `/data/vani-upgrade/` | Docker upgrade workspace |

## Wiki Inventory

| Wiki | Original MW | Skin | Images | DB Dump | Legacy Extensions | Status |
|------|------------|------|--------|---------|-------------------|--------|
| vanisource | 1.40.0 | VaniSkin | 95M | 643M | 5 (fixed) | **DONE** |
| vaniquotes | ~1.35+ | VaniSkin | 496K | 1.7G | 10 | Pending |
| vanipedia | ~1.35+ | VaniSkin | 19G | 583M | 46 extensions | **DONE** |
| vanimedia | ~1.35+ | VaniSkin | 22G | 240M | 5 | Pending |
| vanitest | ~1.35+ | VaniSkin | 19G | 568M | same as vanipedia | Pending |
| vanibooks | 1.23.5 | vector | 704K | 9.3M | all legacy | Pending |
| vanictionary | 1.23.5 | vector | 668K | 7.3M | all legacy | Pending |
| vaniversity | 1.23.5 | vector | 716K | 7.3M | all legacy | Pending |

### Suggested Upgrade Order

1. ~~**vaniquotes** — VaniSkin wiki, small images, shares many extensions with vanisource~~
2. ~~**vanipedia** — largest extension set, but mostly modern already~~ **DONE**
3. **vanitest** — identical to vanipedia, can reuse its config (next: just copy vanipedia config, change DB/port)
4. **vaniquotes** — VaniSkin wiki, small images, shares many extensions with vanisource
5. **vanimedia** — large images (22G), but simpler extension set
6. **vanibooks** — MW 1.23.5 jump, but tiny and uses default vector skin
7. **vanictionary** — same as vanibooks
8. **vaniversity** — same as vanibooks

## Docker Architecture

All wikis share a single Dockerfile (MW 1.43 + PHP 8.2-FPM + SMW 5.x via Composer). Each wiki gets:
- Its own `mediawiki-<wiki>` PHP-FPM container
- Its own `nginx-<wiki>` container on a unique port
- Shared `memcached` container (already running)
- All on `shared-net` network (connects to `mariadb-prod` on port 3307)

### Port Assignments

| Port | Wiki |
|------|------|
| 8082 | vanisource (done) |
| 8083 | vaniquotes |
| 8084 | vanipedia (done) |
| 8085 | vanitest |
| 8086 | vanimedia |
| 8087 | vanibooks |
| 8088 | vanictionary |
| 8089 | vaniversity |

Already in use on Hetzner: 3000, 3001, 7700, 8000.

### Template: Adding a New Wiki

For each new wiki, create `<wiki>/` directory under `/data/vani-upgrade/` with:
```
/data/vani-upgrade/<wiki>/
├── LocalSettings.php      # Updated config
├── global/
│   └── permissions.php    # Copied from vani-mirror/home/global/
├── env/
│   └── <wiki>.env.php     # DB credentials for custom extensions (if needed)
├── menu.dat               # If VaniSkin wiki (copy from old vani server)
├── extensions/            # Custom/non-bundled extensions
│   └── <ExtName>/         # Each extension with extension.json
└── skins/
    └── VaniSkin/          # If VaniSkin wiki (copy + apply fixes)
```

Then add services to `/data/vani-upgrade/docker-compose.yml`:
```yaml
mediawiki-<wiki>:
  build:
    context: ./mediawiki
    dockerfile: Dockerfile
  container_name: mediawiki-<wiki>
  restart: unless-stopped
  volumes:
    - ./<wiki>/LocalSettings.php:/var/www/html/w/LocalSettings.php:ro
    - ./<wiki>/global:/var/www/html/w/global:ro
    - ./<wiki>/skins/VaniSkin:/var/www/html/w/skins/VaniSkin:ro  # if VaniSkin
    # ... extension mounts ...
    - ./<wiki>/menu.dat:/var/www/html/w/menu.dat:ro              # if VaniSkin
    - ./<wiki>/env/<wiki>.env.php:/var/www/<wiki>/<wiki>.env.php:ro  # if custom extensions need DB creds
    - /data/vani-mirror/www/<wiki>/w/images:/var/www/html/w/images
  networks:
    - shared-net
  depends_on:
    - memcached

nginx-<wiki>:
  image: nginx:alpine
  container_name: nginx-<wiki>
  restart: unless-stopped
  ports:
    - "127.0.0.1:<port>:80"
  volumes:
    - ./nginx/<wiki>.conf:/etc/nginx/conf.d/default.conf:ro
    - ./<wiki>/skins/VaniSkin:/var/www/html/w/skins/VaniSkin:ro  # if VaniSkin
    # Mount extensions with static assets (CSS/JS loaded via direct URLs, not ResourceLoader)
    - ./<wiki>/extensions/<ExtWithAssets>:/var/www/html/w/extensions/<ExtWithAssets>:ro
    - /data/vani-mirror/www/<wiki>/w/images:/var/www/html/w/images:ro
  networks:
    - shared-net
  depends_on:
    - mediawiki-<wiki>
```

### Nginx Config Template

Copy `vanisource.conf` and change the `fastcgi_pass` to `mediawiki-<wiki>:9000`.

## Lessons Learned from Vanisource Upgrade

### 1. Deprecated/Removed APIs in MW 1.43

| Removed | Replacement |
|---------|-------------|
| `$wgDBmysql5` | Remove entirely |
| `$wgScriptExtension` | Remove entirely |
| `$wgUseAjax` | Remove entirely |
| `$wgProxyKey` | Rename to `$wgSecretKey` |
| `WikiPage::factory($title)` | `$title->exists()` for existence checks, or `MediaWikiServices::getInstance()->getWikiPageFactory()->newFromTitle($title)` |
| `Hooks::run(...)` | `MediaWikiServices::getInstance()->getHookContainer()->run(...)` |
| `jquery.cookie` ResourceLoader module | Removed in MW 1.43. Foundation's skin bundles its own cookie.js — just remove the dependency from skin.json |

### 2. SMW Version Compatibility

- **MW 1.43 requires SMW 5.x** (not 4.x). SMW 4.x uses `DB_MASTER` constant which was removed in MW 1.43.
- Install via Composer: `"mediawiki/semantic-media-wiki": "~5.0"`
- After container starts, always run: `docker exec mediawiki-<wiki> php /var/www/html/w/extensions/SemanticMediaWiki/maintenance/setupStore.php`
- `Special:SMWAdmin` was renamed to `Special:SemanticMediaWiki` in SMW 5.x

### 3. Composer Security Advisory Workaround

PHPUnit has a security advisory that blocks `composer update`. Add this before the update:
```dockerfile
RUN COMPOSER_ALLOW_SUPERUSER=1 composer config --no-plugins audit.block-insecure false
```

### 4. Legacy Extension Migration (require_once → wfLoadExtension)

Extensions using `require_once` need an `extension.json` wrapper. Pattern:

```json
{
    "name": "ExtensionName",
    "version": "1.1",
    "type": "parserhook",
    "author": ["Original Author"],
    "description": "What it does",
    "requires": { "MediaWiki": ">= 1.39.0" },
    "AutoloadClasses": {
        "ExtensionNameClass": "ExtensionName.body.php",
        "ExtensionNameHooks": "ExtensionNameHooks.php"
    },
    "Hooks": {
        "ParserFirstCallInit": "ExtensionNameHooks::onParserFirstCallInit"
    },
    "MessagesDirs": { "ExtensionName": ["i18n"] },
    "manifest_version": 2
}
```

**i18n migration:** Convert `$messages` arrays in `.i18n.php` files to JSON files in `i18n/en.json`.

**Already migrated (reusable across wikis):**
- VaniAudio — `/data/vani-upgrade/vanisource/extensions/VaniAudio/`
- VaniVideo — `/data/vani-upgrade/vanisource/extensions/VaniVideo/`
- MarkTerms — `/data/vani-upgrade/vanisource/extensions/MarkTerms/`
- googleAnalytics — replaced with inline `$wgHooks['SkinAfterBottomScripts']` closure in LocalSettings.php

**Migrated for vanipedia (reusable):**
- IframePage — `/data/vani-upgrade/vanipedia/extensions/IframePage/` (extension.json wrapper created)
- FactBox — `/data/vani-upgrade/vanipedia/extensions/FactBox/` (extension.json + FactBoxHooks.php created)
- VanipediaApi — `/data/vani-upgrade/vanipedia/extensions/VanipediaApi/` (extension.json + VanipediaApiSetup.php created)
- HeadScript — converted to inline `$wgHooks['BeforePageDisplay']` closure in LocalSettings.php

**Still need migration for other wikis:**
- HeadScript (vanictionary, vaniquotes) — convert to inline hook (same pattern as vanipedia)
- IframePage (vanibooks) — copy from vanipedia
- MenuSidebar (vaniquotes)
- VaniSubcat (vaniquotes)
- VaniFactbox (vaniquotes)
- VaniquotesApi (vaniquotes)
- Mantle (vanibooks, vanictionary, vaniversity)
- MailChimpForms (vaniversity)
- Html5mediator (vaniversity)
- ContributionTracking / DonationInterface (vaniversity)

### 5. VaniSkin Fixes (apply to all VaniSkin wikis)

The VaniSkin needed these fixes for MW 1.43 — apply them once, reuse everywhere:

1. **Remove `var_dump($text)`** in menu loading function
2. **Fix `$_SERVER['SERVER_NAME']` regex** — fails on localhost; add `?? "wikiname"` fallback
3. **Replace `Hooks::run`** with `HookContainer::run`
4. **Remove `jquery.cookie` dependency** from skin.json
5. **Use local `menu.dat`** instead of fetching from `vanipedia.org` (Cloudflare blocks server-side requests)

The fixed VaniSkin at `/data/vani-upgrade/vanisource/skins/VaniSkin/` can be copied to other VaniSkin wikis. Only change the fallback wiki name in `VaniSkin.skin.php`.

### 6. Extensions NOT Bundled in MW 1.43 (must be copied)

These were bundled in older MW but are NOT in the MW 1.43 tarball:
- CharInsert
- Renameuser

Copy from vani-mirror and mount as volumes.

### 7. Memcached Gotchas

- MW uses its own socket-based memcached client — the PHP `Memcached` extension is NOT needed
- After any `flush_all` on memcached, **re-run SMW setupStore.php** or SMW will show an error page
- Config: `$wgMemCachedServers = ['memcached:11211']`

### 8. Maintenance Script Syntax (MW 1.43)

In MW 1.43, `maintenance/run.php` is the entry point. Pass the script name **without** `.php`:
```bash
# Correct:
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php update --quick

# Wrong (will silently exit 255):
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php update.php --quick
```

### 9. Database Migration Commands

```bash
# Schema upgrade (MW 1.40→1.43, or 1.23→1.43)
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php update.php --quick

# SMW store setup
docker exec mediawiki-<wiki> php /var/www/html/w/extensions/SemanticMediaWiki/maintenance/setupStore.php

# Rebuild (optional, for thorough cache/index refresh)
docker exec mediawiki-<wiki> php /var/www/html/w/maintenance/run.php rebuildall.php
```

For wikis jumping from MW 1.23.5, the schema migration is much larger. Expect more table changes but `update --quick` handles it.

### 9. LocalSettings.php Changes Checklist

For every wiki, update these in LocalSettings.php:

- [ ] `$wgDBserver` → `"mariadb-prod"`
- [ ] `$wgServer` → `"http://localhost:<port>"`
- [ ] `$wgMemCachedServers` → `['memcached:11211']`
- [ ] Remove `$wgDBmysql5`, `$wgScriptExtension`, `$wgUseAjax`
- [ ] `$wgProxyKey` → `$wgSecretKey`
- [ ] Replace all `require_once` with `wfLoadExtension`
- [ ] Remove broken `$mobile = mobiledetect()` calls
- [ ] Replace googleAnalytics require_once with inline hook
- [ ] Convert HeadScript require_once to inline `$wgHooks['BeforePageDisplay']` closure
- [ ] Replace `require_once('global/settings.php')` → inline useful settings, skip deprecated ones
- [ ] `$wgDBTableOptions = "TYPE=InnoDB"` → `"ENGINE=InnoDB, DEFAULT CHARSET=binary"`
- [ ] Remove `set_include_path(...)` block, `$wgCommandLineMode` check, `$wgUseTeX`
- [ ] Set `$wgShowExceptionDetails = true` during testing

### 10. Testing Checklist (run after each wiki upgrade)

```bash
# Basic health
curl -s -o /dev/null -w '%{http_code}' http://localhost:<port>/wiki/Main_Page  # expect 200
curl -s -o /dev/null -w '%{http_code}' -L http://localhost:<port>/wiki/NonExistent  # expect 404 (not 500!)
curl -s http://localhost:<port>/wiki/Special:Version | grep 'MediaWiki 1.43'  # confirm version

# API
curl -s 'http://localhost:<port>/w/api.php?action=query&meta=siteinfo&format=json' | python3 -m json.tool | head -5

# Extensions loaded
curl -s 'http://localhost:<port>/w/api.php?action=query&meta=siteinfo&siprop=extensions&format=json' | python3 -c "import sys,json; exts=json.load(sys.stdin)['query']['extensions']; [print(e['name']) for e in exts]"

# Database page count
docker exec mariadb-prod mariadb -u admin -p$MW_DB_PASSWORD <dbname> -e "SELECT COUNT(*) FROM <prefix>page"

# PHP-FPM error log
docker logs mediawiki-<wiki> 2>&1 | tail -20

# SMW status
curl -s http://localhost:<port>/wiki/Special:SemanticMediaWiki | grep -c 'error\|Error'  # expect 0
```

### 11. SSH Tunnel for Browser Testing

From the Mac Mini:
```bash
ssh -i ~/.ssh/id_ed25519_hetzner_ex44 -L <port>:localhost:<port> -N root@157.180.7.100
```
Then open `http://localhost:<port>/wiki/Main_Page` in browser.

## Lessons Learned from Vanipedia Upgrade

### 12. manifest_version 1→2 Config Format

When upgrading `extension.json` from `manifest_version: 1` to `2`, the `config` section format changes. Bare values cause a fatal error (`array_key_exists(): Argument #2 must be of type array`).

```json
// manifest_version 1 (bare values):
"config": { "MyConfigKey": "" }

// manifest_version 2 (must use value/description objects):
"config": { "MyConfigKey": { "value": "", "description": "What it does" } }
```

**Extensions that needed this fix for vanipedia:** GoogleSiteSearch

### 13. Custom Extension Environment Files (`<wiki>.env.php`)

Many Yadasampati custom extensions (VideoShorts, NDropTranslation, SearchAdmin, etc.) have `db_connect.inc`/`.php` files that `require '/var/www/<wiki>/<wiki>.env.php'`. This file contains DB credentials:

```php
<?php
return [
  'DB_USER' => '$MW_ENV_DB_USER',
  'DB_PASS' => '$MW_ENV_DB_PASS',
];
?>
```

**Action needed per wiki:**
1. Create `env/<wiki>.env.php` in the wiki's upgrade directory
2. Mount it at `/var/www/<wiki>/<wiki>.env.php:ro` in docker-compose.yml
3. Update ALL `db_connect.inc`/`.php` files: change `$host = "localhost"` → `$host = "mariadb-prod"`

**Extensions with db_connect files (vanipedia):** VideoShorts, NDropTranslation, NDropStatistics, CPStatistics, CategoryAdmin, LangAdmin, UserAdmin, UserSeva, RevisionManager, SearchAdmin, QuotesAdmin, TranPropAdmin

### 14. Custom Databases (vp_search, vp_translate)

These custom databases exist on the old server but NOT yet on mariadb-prod:
- `vp_search` — used by SearchAdmin, CategoryAdmin, LangAdmin, CPStatistics, NDropStatistics, ExternalData, UserAdmin, UserSeva, RevisionManager, QuotesAdmin, NDropTranslation
- `vp_translate` — used by VideoShorts

The extensions load and their special pages render, but they'll show DB connection errors when actually queried until these databases are migrated.

### 15. Nginx Must Serve Extension Static Assets

Extensions with CSS/JS loaded via direct `<link>`/`<script>` tags (e.g., from HeadScript inline hook) need their directories mounted in the **nginx** container too — not just the mediawiki container. Otherwise those assets return 404.

This applies to extensions that load assets outside of ResourceLoader (via `addHeadItem()` calls). Mount them as `:ro` volumes in the nginx service.

### 16. SMW setupStore After Container Recreation

Any time a mediawiki container is recreated (`docker compose up -d` after config changes), the SMW upgrade key in memcached is invalidated. **Always re-run setupStore.php** after recreation, or all pages will show the SMW "ERROR_SCHEMA_INVALID_KEY" error page.

```bash
docker exec mediawiki-<wiki> php /var/www/html/w/extensions/SemanticMediaWiki/maintenance/setupStore.php
```

### 17. Tabs Extension PHP 8.2 Deprecation Warnings

The Tabs extension (`/extensions/Tabs/includes/Tabs.php`) has PHP 8.2 deprecation warnings about optional parameters before required parameters. These are non-breaking and cosmetic only — the extension still functions correctly.

## Per-Wiki Extension Notes

### vaniquotes (next up)
- Has MarkTerms, VaniAudio, VaniVideo (already migrated for vanisource — copy them)
- Has unique legacy extensions: MenuSidebar, VaniSubcat, VaniFactbox, VaniquotesApi, HeadScript — these all need extension.json wrappers
- Uses SMW — same Composer setup as vanisource
- Uses Variables, Loops — non-bundled, need to be copied

### vanipedia (DONE)
- **46 extensions** loaded and working on port 8084
- 136,464 pages, 255,450 revisions, 1,429 images (19GB bind-mounted)
- Legacy extensions migrated: IframePage (extension.json), FactBox (extension.json + hooks class), VanipediaApi (extension.json + setup class), HeadScript (inline hook)
- 6 extensions fixed manifest_version 1→2: VaniNavigation, ImportArticles, TranPropAdmin, NDropTranslation, GoogleDocs4MW, GoogleSiteSearch
- GoogleSiteSearch config format fixed for manifest_version 2
- vanipedia.env.php mounted for 12 custom extensions with db_connect files
- All db_connect files updated: `localhost` → `mariadb-prod`
- 20 extensions mounted in nginx for static asset serving
- **Remaining:** vp_search/vp_translate databases not migrated, VaniSearch static assets incomplete, GA commented out
- Config at `/data/vani-upgrade/vanipedia/`

### vanitest
- Mirror of vanipedia — duplicate vanipedia's config, change DB name/prefix/port

### vanimedia
- Large images (22G) — bind mount, don't copy
- Legacy: MobileDetect, VaniAudio, googleAnalytics, ReplaceText (old require_once version), InputBox
- Simpler extension set than vanipedia

### vanibooks / vanictionary / vaniversity
- MW 1.23.5 → 1.43 is a huge jump (20 version increments)
- Use default vector skin (no VaniSkin fixes needed)
- All extensions are legacy `require_once` — many are now bundled in MW 1.43
- Small wikis, small databases — upgrade should be fast once extensions are sorted
- Some extensions (Mantle, MailChimpForms, Html5mediator, DonationInterface) may be obsolete

## Disk Space

`/data` has **1.6TB free** out of 1.9TB (9% used). Plenty of room for all wikis.
