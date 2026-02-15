<?php
/**
 * Vaniquotes LocalSettings.php — MediaWiki 1.43 LTS (Docker upgrade)
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
$wgSitename         = "Vaniquotes";
$wgServer           = 'http://localhost:8083';
$wgScriptPath       = "/w";
$wgArticlePath      = '/wiki/$1';
$wgUsePathInfo      = true;

#----------------------------------------------------------------------
# Database settings — Docker networking to mariadb-prod container
#----------------------------------------------------------------------
$wgDBtype           = "mysql";
$wgDBserver         = "mariadb-prod";
$wgDBname           = "vaniquotes";
$wgDBuser           = "admin";
$wgDBpassword       = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix         = "vaniquotes_";
$wgDBTableOptions   = "ENGINE=InnoDB, DEFAULT CHARSET=binary";

# REMOVED: $wgDBmysql5 (deprecated, removed in MW 1.43)
# REMOVED: $wgScriptExtension (deprecated)
# REMOVED: $wgUseAjax (deprecated)
# REMOVED: $wgUseTeX (deprecated)

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

$wgJobRunRate = 0.01;

#----------------------------------------------------------------------
# Email
#----------------------------------------------------------------------
$wgEnableEmail      = true;
$wgEnableUserEmail  = true;
$wgEmergencyContact = "webservant@vaniquotes.org";
$wgPasswordSender   = "webservant@vaniquotes.org";
$wgEnotifUserTalk   = true;
$wgEnotifWatchlist  = true;
$wgEmailAuthentication = false;

#----------------------------------------------------------------------
# Uploads and images
#----------------------------------------------------------------------
$wgEnableUploads       = true;
$wgMaxUploadSize       = 1024 * 1024 * 100; # 100MB
$wgHashedUploadDirectory = false;
$wgUploadPath          = "/w/images";
$wgUploadDirectory     = "$IP/images";
$wgUseImageMagick      = false;
$wgFileExtensions      = [ 'png', 'gif', 'jpg', 'jpeg', 'mp3', 'svg', 'pdf', 'mm' ];

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

# REMOVED: $mobile = mobiledetect(); (broken, not needed)

#----------------------------------------------------------------------
# Licensing / copyright
#----------------------------------------------------------------------
$wgRightsPage = "Mediawiki:Copyright";
$wgRightsUrl  = "";
$wgRightsText = "";

#----------------------------------------------------------------------
# Appearance
#----------------------------------------------------------------------
$wgLogo    = '/w/images/Vaniquotes-logo-small.png';
$wgFavicon = '/w/images/favicon.ico';

# Enable HTML tag
$wgRawHtml = true;

# Hide Page Title Extension
$wgRestrictDisplayTitle = false;

#----------------------------------------------------------------------
# Language & misc
#----------------------------------------------------------------------
$wgLanguageCode     = "en";
$wgLocalInterwiki   = strtolower( $wgSitename );
$wgDiff3            = "/usr/bin/diff3";
$wgAllowSlowParserFunctions = true;

# Cache epoch — invalidate caches when config changes
$configdate   = gmdate( 'YmdHis', @filemtime( __FILE__ ) );
$wgCacheEpoch = max( $wgCacheEpoch, $configdate );

#----------------------------------------------------------------------
# Categories
#----------------------------------------------------------------------
$wgCategoryPagingLimit = 10000;
$wgCategoryTreeDefaultOptions['depth'] = 3;
$wgCategoryTreeCategoryPageOptions['mode'] = 'all';
$wgCategoryTreeMaxChildren = 500;

#----------------------------------------------------------------------
# Namespaces
#----------------------------------------------------------------------
$wgContentNamespaces = [ 0, 14 ];
$wgSitemapNamespaces = [ 0, 14 ];
$wgExtraNamespaces[100] = "Manual";
$wgExtraNamespaces[101] = "Manual_talk";

#----------------------------------------------------------------------
# Permissions — load from global file
#----------------------------------------------------------------------
require_once( "$IP/global/permissions.php" );

# From global/settings.php (inlined, minus deprecated $wgUseAjax)
$wgAllowUserJs  = true;
$wgAllowUserCss = true;

# Bot group permissions
$wgGroupPermissions['bot']['read']       = true;
$wgGroupPermissions['bot']['edit']       = true;
$wgGroupPermissions['bot']['createpage'] = true;
$wgGroupPermissions['bot']['move']       = true;
$wgGroupPermissions['bot']['sendemail']  = true;

# Editor / sysop groups
$wgGroupPermissions['Editor']['writeapi']  = true;
$wgGroupPermissions['sysop']['writeapi']   = true;
$wgGroupPermissions['sysop']['renameuser'] = true;
$wgGroupPermissions['bureaucrat']['replacetext'] = true;

# Custom groups
$wgGroupPermissions['CategoryWrapper']['wrapcategory'] = true;

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
# Extensions — all using wfLoadExtension (MW 1.43 compatible)
#----------------------------------------------------------------------

# Bundled extensions
wfLoadExtension( 'CategoryTree' );
wfLoadExtension( 'Cite' );
wfLoadExtension( 'CiteThisPage' );
wfLoadExtension( 'InputBox' );
wfLoadExtension( 'ParserFunctions' );
$wgPFEnableStringFunctions = true;
wfLoadExtension( 'ReplaceText' );
wfLoadExtension( 'Renameuser' );
wfLoadExtension( 'WikiEditor' );

# Non-bundled extensions (reused from vanisource)
wfLoadExtension( 'HeaderTabs' );
$wgHeaderTabsEditTabLink = false;
wfLoadExtension( 'Variables' );
wfLoadExtension( 'Loops' );
wfLoadExtension( 'RandomImage' );
wfLoadExtension( 'RandomSelection' );
wfLoadExtension( 'EmbedVideo' );
wfLoadExtension( 'CharInsert' );
wfLoadExtension( 'MobileDetect' );

# Display extensions
wfLoadExtension( 'NoTitle' );

# VaniAudio / VaniVideo (migrated to extension.json)
wfLoadExtension( 'VaniAudio' );
$wgVaniAudioSettings['tags'] = [ 'mp3player' ];
wfLoadExtension( 'VaniVideo' );
$wgVaniVideoSettings['tags'] = [ 'video', 'mp4player', 'mp4video' ];

# MarkTerms (must load before VaniquotesApi)
wfLoadExtension( 'MarkTerms' );

# Vaniquotes-specific extensions
wfLoadExtension( 'MenuSidebar' );
wfLoadExtension( 'VaniSubcat' );
wfLoadExtension( 'VaniFactbox' );
wfLoadExtension( 'VaniquotesApi' );
wfLoadExtension( 'VaniUrlRouter' );
wfLoadExtension( 'VaniSearch' );
wfLoadExtension( 'CategoryMove' );
wfLoadExtension( 'QuoteStats' );
wfLoadExtension( 'AI_CategoryWrapper' );
wfLoadExtension( 'AI_PageLinker' );

# ExternalData
wfLoadExtension( 'ExternalData' );
# TODO: vp_search database does not exist on mariadb-prod yet.
# $wgExternalDataSources['vanisearch'] = [
#   'server' => 'mariadb-prod',
#   'type' => 'mysql',
#   'name' => 'vp_search',
#   'user' => getenv('MW_ENV_DB_USER'),
#   'password' => getenv('MW_ENV_DB_PASS')
# ];

# SMW disabled (was commented out in original config)
# wfLoadExtension( 'SemanticMediaWiki' );
# enableSemantics( 'vaniquotes.org' );

$smwgChangePropagationProtection = false;

#----------------------------------------------------------------------
# HeadScript — inline replacement (was require_once HeadScript.php)
# Injects page-specific CSS/JS for AI_CategoryWrapper and AI_PageLinker
#----------------------------------------------------------------------
$wgHooks['BeforePageDisplay'][] = function ( OutputPage &$out, Skin &$skin ) {
	$title = $out->getPageTitle();

	if ( $title == "AI Category Wrapper" ) {
		$script = '
			<link rel="stylesheet" type="text/css" href="/w/extensions/AI_CategoryWrapper/css/fonts.css?version=1">
			<link rel="stylesheet" type="text/css" href="/w/extensions/AI_CategoryWrapper/css/main.css?version=11">
			<link rel="stylesheet" type="text/css" href="/w/extensions/AI_CategoryWrapper/css/tabs.css?version=1">
			<script type="text/javascript" src="/w/extensions/AI_CategoryWrapper/js/catg.js?version=26"></script>
			<script type="text/javascript" src="/w/extensions/AI_CategoryWrapper/js/html.js?version=13"></script>
			<script type="text/javascript" src="/w/extensions/AI_CategoryWrapper/js/main.js?version=21"></script>
		';
		$out->addHeadItem( "HeadItems script", $script );
	} elseif ( $title == "AI Page Linker" ) {
		$script = '
			<link rel="stylesheet" type="text/css" href="/w/extensions/AI_PageLinker/css/fonts.css?version=1">
			<link rel="stylesheet" type="text/css" href="/w/extensions/AI_PageLinker/css/main.css?version=11">
			<link rel="stylesheet" type="text/css" href="/w/extensions/AI_PageLinker/css/tabs.css?version=1">
			<script type="text/javascript" src="/w/extensions/AI_PageLinker/js/catg.js?version=22"></script>
			<script type="text/javascript" src="/w/extensions/AI_PageLinker/js/html.js?version=12"></script>
			<script type="text/javascript" src="/w/extensions/AI_PageLinker/js/main.js?version=17"></script>
		';
		$out->addHeadItem( "HeadItems script", $script );
	}

	return true;
};

#----------------------------------------------------------------------
# Google Analytics — inline hook (placeholder, GA UA is legacy)
# Replace with GA4 when ready
#----------------------------------------------------------------------
# $wgHooks['SkinAfterBottomScripts'][] = function ( $skin, &$text ) {
# 	$text .= <<<'GAHTML'
# <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
# <script>
#   window.dataLayer = window.dataLayer || [];
#   function gtag(){dataLayer.push(arguments);}
#   gtag('js', new Date());
#   gtag('config', 'G-XXXXXXX');
# </script>
# GAHTML;
# 	return true;
# };

#----------------------------------------------------------------------
# Heavy special pages disabled (from original config)
#----------------------------------------------------------------------
$wgHooks['SpecialPage_initList'][] = function ( &$list ) {
	$heavyPages = [
		'Ancientpages', 'Mostcategories', 'Mostlinkedpages',
		'Wantedpages', 'Wantedcategories', 'Unusedcategories',
		'Unusedfiles', 'Deadendpages', 'Brokenredirects',
		'DoubleRedirects', 'Fewestrevisions', 'Lonelypages',
		'Shortpages', 'Longpages'
	];
	foreach ( $heavyPages as $page ) {
		unset( $list[$page] );
	}
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
