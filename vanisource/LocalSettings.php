<?php
/**
 * Vanisource LocalSettings.php — MediaWiki 1.43 LTS (Docker upgrade)
 * Migrated from MW 1.40.0
 */

error_reporting( 0 );

if ( defined( 'MW_INSTALL_PATH' ) ) {
	$IP = MW_INSTALL_PATH;
} else {
	$IP = dirname( __FILE__ );
}

## If PHP's memory limit is very low, some operations may fail.
ini_set( 'memory_limit', '512M' );

#----------------------------------------------------------------------
# General site settings
#----------------------------------------------------------------------
$wgSitename         = "Vanisource";
$wgServer           = 'http://localhost:8082';
$wgScriptPath       = "/w";
$wgArticlePath      = '/wiki/$1';
$wgUsePathInfo      = true;

#----------------------------------------------------------------------
# Database settings — Docker networking to mariadb-prod container
#----------------------------------------------------------------------
$wgDBtype           = "mysql";
$wgDBserver         = "mariadb-prod";
$wgDBname           = "vanisource";
$wgDBuser           = "admin";
$wgDBpassword       = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix         = "vanisource_";
$wgDBTableOptions   = "ENGINE=InnoDB, DEFAULT CHARSET=binary";

# REMOVED: $wgDBmysql5 (deprecated, removed in MW 1.43)
# REMOVED: $wgScriptExtension (deprecated)
# REMOVED: $wgUseAjax (deprecated)

#----------------------------------------------------------------------
# Security
#----------------------------------------------------------------------
$wgSecretKey = getenv('MW_SECRET_KEY') ?: "PLACEHOLDER";

#----------------------------------------------------------------------
# Caching — Memcached via Docker container
#----------------------------------------------------------------------
$wgMainCacheType    = CACHE_MEMCACHED;
$wgParserCacheType  = CACHE_MEMCACHED;
$wgMessageCacheType = CACHE_MEMCACHED;
$wgSessionCacheType = CACHE_DB;
$wgMemCachedServers = [ 'memcached:11211' ];

#----------------------------------------------------------------------
# Email
#----------------------------------------------------------------------
$wgEnableEmail      = true;
$wgEnableUserEmail  = true;
$wgEmergencyContact = "webmaster@vanisource.org";
$wgPasswordSender   = "webmaster@vanisource.org";
$wgEnotifUserTalk   = true;
$wgEnotifWatchlist  = true;
$wgEmailAuthentication = true;

#----------------------------------------------------------------------
# Uploads and images
#----------------------------------------------------------------------
$wgEnableUploads       = true;
$wgMaxUploadSize       = 1024 * 1024 * 100; # 100MB
$wgHashedUploadDirectory = false;
$wgUploadPath          = "/w/images";
$wgUploadDirectory     = "$IP/images";
$wgFileExtensions      = [ 'png', 'gif', 'jpg', 'jpeg', 'mp3', 'svg', 'pdf' ];

# Foreign file repo for vanimedia images
$wgForeignFileRepos[] = [
	'class' => 'ForeignAPIRepo',
	'name' => 'vanimedia',
	'apibase' => 'https://vanimedia.org/w/api.php',
	'hashLevels' => 2,
	'fetchDescription' => true,
	'descriptionCacheExpiry' => 43200,
	'apiThumbCacheExpiry' => 0,
];

#----------------------------------------------------------------------
# Skin
#----------------------------------------------------------------------
$wgDefaultSkin = 'VaniSkin';
wfLoadSkin( 'VaniSkin' );

$wgForegroundFeatures = [
	'showActionsForAnon' => false,
	'NavWrapperType' => 'divonly',
	'showHelpUnderTools' => false,
	'showRecentChangesUnderTools' => true,
	'enableTabs' => false,
	'wikiName' => &$GLOBALS['wgSitename'],
	'navbarIcon' => false,
	'IeEdgeCode' => 1,
	'showFooterIcons' => 1,
	'addThisFollowPUBID' => ''
];

# REMOVED: $mobile = mobiledetect(); (broken since MW 1.40, not needed)

#----------------------------------------------------------------------
# Licensing / copyright
#----------------------------------------------------------------------
$wgRightsPage = "Mediawiki:Copyright";
$wgRightsUrl  = "";
$wgRightsText = "";
$wgRightsIcon = "";

#----------------------------------------------------------------------
# Appearance
#----------------------------------------------------------------------
$wgLogo    = '/w/images/Vanisource-logo-small.png';
$wgFavicon = '/w/images/favicon.ico';

#----------------------------------------------------------------------
# Language & misc
#----------------------------------------------------------------------
$wgLanguageCode     = "en";
$wgLocalInterwiki   = strtolower( $wgSitename );
$wgDiff3            = "/usr/bin/diff3";
$wgExternalLinkTarget = '_blank';

# Cache epoch — invalidate caches when config changes
$configdate   = gmdate( 'YmdHis', @filemtime( __FILE__ ) );
$wgCacheEpoch = max( $wgCacheEpoch, $configdate );

#----------------------------------------------------------------------
# API
#----------------------------------------------------------------------
$wgEnableAPI      = true;
$wgEnableWriteAPI = true;

#----------------------------------------------------------------------
# Permissions — load from global file
#----------------------------------------------------------------------
require_once( "$IP/global/permissions.php" );

$wgGroupPermissions['Editor']['writeapi'] = true;
$wgGroupPermissions['sysop']['writeapi']  = true;

$wgGroupPermissions['interface-admin']['editinterface']  = true;
$wgGroupPermissions['interface-admin']['editsitecss']    = true;
$wgGroupPermissions['interface-admin']['editsitejs']     = true;
$wgGroupPermissions['interface-admin']['editsitejson']   = true;
$wgGroupPermissions['interface-admin']['editusercss']    = true;
$wgGroupPermissions['interface-admin']['edituserjs']     = true;
$wgGroupPermissions['interface-admin']['edituserjson']   = true;

$wgGroupPermissions['bot']['read']      = true;
$wgGroupPermissions['bot']['edit']      = true;
$wgGroupPermissions['bot']['createpage'] = true;
$wgGroupPermissions['bot']['move']      = true;
$wgGroupPermissions['bot']['sendemail'] = true;

$wgGroupPermissions['bureaucrat']['replacetext'] = true;

# User preferences
$wgAllowUserJs   = true;
$wgAllowUserCss  = true;
$wgDefaultUserOptions['editsection'] = 0;

#----------------------------------------------------------------------
# Categories
#----------------------------------------------------------------------
$wgCategoryPagingLimit = 5000;
$wgCategoryTreeDefaultOptions['depth'] = 3;
$wgCategoryTreeCategoryPageOptions['mode'] = 'all';
$wgCategoryTreeMaxChildren = 500;

#----------------------------------------------------------------------
# Extra namespaces
#----------------------------------------------------------------------
$wgExtraNamespaces[102] = "Tools";
$wgExtraNamespaces[103] = "Tools_talk";

#----------------------------------------------------------------------
# Extensions — all using wfLoadExtension (MW 1.43 compatible)
#----------------------------------------------------------------------

# Bundled extensions
wfLoadExtension( 'CategoryTree' );
wfLoadExtension( 'CharInsert' );
wfLoadExtension( 'CiteThisPage' );
wfLoadExtension( 'InputBox' );
wfLoadExtension( 'ParserFunctions' );
$wgPFEnableStringFunctions = true;
wfLoadExtension( 'ReplaceText' );
$wgReplaceTextResultsLimit = 700;
wfLoadExtension( 'Renameuser' );
$wgGroupPermissions['sysop']['renameuser'] = true;
wfLoadExtension( 'TextExtracts' );
wfLoadExtension( 'WikiEditor' );
$wgDefaultUserOptions['usebetatoolbar']     = 1;
$wgDefaultUserOptions['usebetatoolbar-cgd'] = 1;
$wgDefaultUserOptions['wikieditor-preview'] = 1;
$wgDefaultUserOptions['wikieditor-publish'] = 1;

# Non-bundled extensions (copied from original install)
wfLoadExtension( 'HeaderTabs' );
wfLoadExtension( 'Variables' );
wfLoadExtension( 'RandomImage' );
$wgRandomImageNoCache = true;
wfLoadExtension( 'Loops' );
wfLoadExtension( 'RandomSelection' );
wfLoadExtension( 'EmbedVideo' );
wfLoadExtension( 'MobileDetect' );

# Semantic MediaWiki
wfLoadExtension( 'SemanticMediaWiki' );
enableSemantics( 'vanisource.org' );
$smwgShowFactbox    = SMW_FACTBOX_NONEMPTY;
$smwgCategoryFeatures = SMW_CAT_NONE;
unset( $wgFooterIcons['poweredby']['semanticmediawiki'] );

# Custom extensions (with extension.json)
wfLoadExtension( 'VaniUrlRouter' );
wfLoadExtension( 'VaniSearch' );
wfLoadExtension( 'VanibotExec' );
wfLoadExtension( 'PrabhupadaChat' );

# Legacy extensions (migrated to extension.json)
wfLoadExtension( 'VaniAudio' );
$wgVaniAudioSettings['tags'] = [ 'mp3player' ];
wfLoadExtension( 'VaniVideo' );
$wgVaniVideoSettings['tags'] = [ 'video', 'mp4player', 'mp4video' ];
wfLoadExtension( 'MarkTerms' );

#----------------------------------------------------------------------
# Google Analytics — replaced require_once with inline hook
# (the old googleAnalytics extension used require_once, no extension.json)
#----------------------------------------------------------------------
$wgHooks['SkinAfterBottomScripts'][] = function ( $skin, &$text ) {
	$text .= <<<'GAHTML'
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-27941646-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('set', 'anonymize_ip', true);
  gtag('config', 'UA-27941646-1');
</script>
GAHTML;
	return true;
};

#----------------------------------------------------------------------
# HelloBar advertising script (replaces inline onBeforePageDisplay function)
#----------------------------------------------------------------------
$wgHooks['BeforePageDisplay'][] = function ( OutputPage &$out, Skin &$skin ) {
	$script = '<script src="https://my.hellobar.com/fac32c515ce108f038178e4f295bbf4c6c193436.js" type="text/javascript" charset="utf-8" async="async"></script>';
	$out->addHeadItem( "hellobar-script", $script );
	return true;
};

#----------------------------------------------------------------------
# Search
#----------------------------------------------------------------------
$wgDisableTextSearch = true;

#----------------------------------------------------------------------
# Debug (enable during testing, disable for production)
#----------------------------------------------------------------------
$wgShowExceptionDetails = true;
