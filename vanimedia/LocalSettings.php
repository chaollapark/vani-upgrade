<?php
/**
 * Vanimedia LocalSettings.php — MediaWiki 1.43 LTS (Docker upgrade)
 * Migrated from MW ~1.35+
 */

error_reporting( 0 );

if ( defined( 'MW_INSTALL_PATH' ) ) {
	$IP = MW_INSTALL_PATH;
} else {
	$IP = dirname( __FILE__ );
}

ini_set( 'memory_limit', '512M' );

#----------------------------------------------------------------------
# General site settings
#----------------------------------------------------------------------
$wgSitename         = "Vanimedia";
$wgServer           = 'http://localhost:8086';
$wgScriptPath       = "/w";
$wgArticlePath      = '/wiki/$1';
$wgUsePathInfo      = true;

#----------------------------------------------------------------------
# Database settings — Docker networking to mariadb-prod container
#----------------------------------------------------------------------
$wgDBtype           = "mysql";
$wgDBserver         = "mariadb-prod";
$wgDBname           = "vanimedia";
$wgDBuser           = "admin";
$wgDBpassword       = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix         = "vanimedia_";
$wgDBTableOptions   = "ENGINE=InnoDB, DEFAULT CHARSET=binary";

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
$wgEmergencyContact = "webservant@vanimedia.org";
$wgPasswordSender   = "webservant@vanimedia.org";
$wgEnotifUserTalk   = true;
$wgEnotifWatchlist  = true;
$wgEmailAuthentication = true;

#----------------------------------------------------------------------
# Uploads and images
#----------------------------------------------------------------------
$wgEnableUploads       = true;
$wgMaxUploadSize       = 1024 * 1024 * 100; # 100MB
$wgUploadSizeWarning   = 0;
$wgHashedUploadDirectory = true;
$wgUploadPath          = "/w/images";
$wgUploadDirectory     = "$IP/images";
$wgUseImageMagick      = false;
$wgFileExtensions      = [ 'png', 'gif', 'jpg', 'jpeg', 'mp3', 'svg', 'pdf' ];

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

#----------------------------------------------------------------------
# Licensing / copyright
#----------------------------------------------------------------------
$wgRightsPage = "Mediawiki:Copyright";
$wgRightsUrl  = "";
$wgRightsText = "";

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

# Cache epoch
$configdate   = gmdate( 'YmdHis', @filemtime( __FILE__ ) );
$wgCacheEpoch = max( $wgCacheEpoch, $configdate );

#----------------------------------------------------------------------
# Categories
#----------------------------------------------------------------------
$wgCategoryPagingLimit = 5000;
$wgCategoryTreeDefaultOptions['depth'] = 3;
$wgCategoryTreeCategoryPageOptions['mode'] = 'all';
$wgCategoryTreeMaxChildren = 500;

#----------------------------------------------------------------------
# Namespaces
#----------------------------------------------------------------------
$wgExtraNamespaces[102] = "Tools";
$wgExtraNamespaces[103] = "Tools_talk";

#----------------------------------------------------------------------
# Permissions — load from global file
#----------------------------------------------------------------------
require_once( "$IP/global/permissions.php" );

$wgAllowUserJs  = true;
$wgAllowUserCss = true;

$wgDefaultUserOptions['editsection'] = 0;

# Editor / sysop groups
$wgGroupPermissions['Editor']['writeapi']  = true;
$wgGroupPermissions['sysop']['writeapi']   = true;
$wgGroupPermissions['sysop']['renameuser'] = true;
$wgGroupPermissions['bureaucrat']['replacetext'] = true;
$wgGroupPermissions['MenuEditor']['editmenu'] = true;

# Bot group
$wgGroupPermissions['bot']['read']       = true;
$wgGroupPermissions['bot']['edit']       = true;
$wgGroupPermissions['bot']['createpage'] = true;
$wgGroupPermissions['bot']['move']       = true;
$wgGroupPermissions['bot']['movefile']   = true;
$wgGroupPermissions['bot']['sendemail']  = true;

# Interface admin
$wgGroupPermissions['interface-admin']['editinterface']  = true;
$wgGroupPermissions['interface-admin']['editsitecss']    = true;
$wgGroupPermissions['interface-admin']['editsitejs']     = true;
$wgGroupPermissions['interface-admin']['editsitejson']   = true;
$wgGroupPermissions['interface-admin']['editusercss']    = true;
$wgGroupPermissions['interface-admin']['edituserjs']     = true;
$wgGroupPermissions['interface-admin']['edituserjson']   = true;

#----------------------------------------------------------------------
# WikiEditor preferences
#----------------------------------------------------------------------
$wgDefaultUserOptions['usebetatoolbar']     = 1;
$wgDefaultUserOptions['usebetatoolbar-cgd'] = 1;
$wgDefaultUserOptions['wikieditor-preview'] = 1;
$wgDefaultUserOptions['wikieditor-publish'] = 1;

#----------------------------------------------------------------------
# Extensions
#----------------------------------------------------------------------

# Bundled
wfLoadExtension( 'CategoryTree' );
wfLoadExtension( 'Cite' );
wfLoadExtension( 'InputBox' );
wfLoadExtension( 'ParserFunctions' );
$wgPFEnableStringFunctions = true;
wfLoadExtension( 'ReplaceText' );
wfLoadExtension( 'Renameuser' );
wfLoadExtension( 'WikiEditor' );

# Non-bundled
wfLoadExtension( 'HeaderTabs' );
wfLoadExtension( 'Loops' );
wfLoadExtension( 'RandomImage' );
$wgRandomImageNoCache = true;
wfLoadExtension( 'RandomSelection' );
wfLoadExtension( 'EmbedVideo' );
wfLoadExtension( 'CharInsert' );
wfLoadExtension( 'MobileDetect' );

# VaniAudio
wfLoadExtension( 'VaniAudio' );
$wgVaniAudioSettings['tags'] = [ 'mp3player' ];

# VaniSearch
wfLoadExtension( 'VaniSearch' );

#----------------------------------------------------------------------
# Debug
#----------------------------------------------------------------------
$wgShowExceptionDetails = true;
