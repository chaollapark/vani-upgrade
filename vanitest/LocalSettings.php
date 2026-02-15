<?php
/**
 * Vanitest LocalSettings.php — MediaWiki 1.43 LTS (Docker upgrade)
 * Copied from vanipedia config, changed DB/port/sitename
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
$wgSitename         = "Vanitest";
$wgServer           = 'http://localhost:8085';
$wgScriptPath       = "/w";
$wgArticlePath      = '/wiki/$1';
$wgUsePathInfo      = true;

#----------------------------------------------------------------------
# Database settings — Docker networking to mariadb-prod container
#----------------------------------------------------------------------
$wgDBtype           = "mysql";
$wgDBserver         = "mariadb-prod";
$wgDBname           = "vanitest";
$wgDBuser           = "admin";
$wgDBpassword       = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix         = "vanitest_";
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

#----------------------------------------------------------------------
# Email
#----------------------------------------------------------------------
$wgEnableEmail      = true;
$wgEnableUserEmail  = true;
$wgEmergencyContact = "webservant@vanitest.org";
$wgPasswordSender   = "webservant@vanitest.org";
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
$wgUseImageMagick      = false;
$wgFileExtensions      = [ 'png', 'gif', 'jpg', 'jpeg', 'mp3', 'svg', 'pdf' ];

# Foreign file repo for vanimedia images
$wgForeignFileRepos[] = [
	'class' => 'ForeignAPIRepo',
	'name' => 'vanimedia',
	'apibase' => 'https://vanimedia.org/w/api.php',
	'hashLevels' => 2,
	'fetchDescription' => true,
	'scriptDirUrl' => 'https://vanimedia.org/w',
	'descriptionCacheExpiry' => 43200,
	'apiThumbCacheExpiry' => 86400,
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
$wgEnableCreativeCommonsRdf = true;
$wgRightsPage = "MediaWiki:Copyright";
$wgRightsUrl  = "http://www.vanitest.org/wiki/Vanitest:Copyright";
$wgRightsText = "GNU Free Documentation License 1.2";

#----------------------------------------------------------------------
# Appearance
#----------------------------------------------------------------------
$wgLogo    = '/w/images/Vanipedia-logo-small.png';
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
$wgExternalLinkTarget = '_blank';

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
# Permissions — load from global file
#----------------------------------------------------------------------
require_once( "$IP/global/permissions.php" );

# From global/settings.php (inlined, minus deprecated $wgUseAjax)
$wgAllowUserJs  = true;
$wgAllowUserCss = true;

$wgEnableUserJs = true;
$wgAllowHtml    = true;

# Bot group permissions
$wgGroupPermissions['bot']['read']       = true;
$wgGroupPermissions['bot']['edit']       = true;
$wgGroupPermissions['bot']['createpage'] = true;
$wgGroupPermissions['bot']['move']       = true;
$wgGroupPermissions['bot']['sendemail']  = true;
$wgGroupPermissions['bot']['writeapi']   = true;

# Editor group
$wgGroupPermissions['Editor']['writeapi']  = true;
$wgGroupPermissions['Editor']['sendemail'] = true;

# Custom groups
$wgGroupPermissions['MenuEditor']['editmenu']          = true;
$wgGroupPermissions['RevisionManager']['revmanage']    = true;
$wgGroupPermissions['VideoShorts']['videoshorts']       = true;

# Sysop
$wgGroupPermissions['sysop']['renameuser'] = true;

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
$wgDefaultUserOptions['wikieditor-preview'] = 0;
$wgDefaultUserOptions['wikieditor-publish'] = 0;
$wgDefaultUserOptions['usenavigabletoc']    = 0;

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

# Non-bundled extensions (copied from original install / vanisource)
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
wfLoadExtension( 'Tabs' );

# ExternalData
wfLoadExtension( 'ExternalData' );
# TODO: vp_search database does not exist on mariadb-prod yet.
# Uncomment when the database is set up:
# $wgExternalDataSources['vanisearch'] = [
#   'server' => 'mariadb-prod',
#   'type' => 'mysql',
#   'name' => 'vp_search',
#   'user' => getenv('MW_ENV_DB_USER'),
#   'password' => getenv('MW_ENV_DB_PASS')
# ];

# Google Site Search
wfLoadExtension( 'GoogleSiteSearch' );
$wgGoogleSiteSearchCSEID = '000527094198246294321:m501vzxqdq4';

# Google Docs for MW
wfLoadExtension( 'GoogleDocs4MW' );

# Semantic MediaWiki
wfLoadExtension( 'SemanticMediaWiki' );
enableSemantics( 'vanitest.org' );

# IframePage
wfLoadExtension( 'IframePage' );
$wgIframePageSrc = [
	'Donating to Vanipedia' => 'https://cdn.donately.com/dntly-core/1.4/iframe.html?donately_id=act_b5b0f2a4601b&donately_presets=10,15,25,50&stripe_publishable_key=pk_live_c9gzjyh3VHuHcbOe8D0Yy4SN&donately_anonymous=true&donately_amount=108',
	'Make your own Vani-yantras' => 'http://vaniwordcloud-app.herokuapp.com/'
];

# FactBox
wfLoadExtension( 'FactBox' );

# VanipediaApi
wfLoadExtension( 'VanipediaApi' );

# Legacy extensions (migrated to extension.json)
wfLoadExtension( 'VaniAudio' );
$wgVaniAudioSettings['tags'] = [ 'mp3player', 'mp3audio' ];
wfLoadExtension( 'VaniVideo' );
$wgVaniVideoSettings['tags'] = [ 'video', 'mp4player', 'mp4video' ];

# Custom extensions (with extension.json)
wfLoadExtension( 'VaniSearch' );
wfLoadExtension( 'VaniNavigation' );
wfLoadExtension( 'ImportArticles' );
wfLoadExtension( 'VideoShorts' );
wfLoadExtension( 'UserAdmin' );
wfLoadExtension( 'LangAdmin' );
wfLoadExtension( 'UserSeva' );
wfLoadExtension( 'RevisionManager' );
wfLoadExtension( 'SearchAdmin' );
wfLoadExtension( 'QuotesAdmin' );
wfLoadExtension( 'CategoryAdmin' );
wfLoadExtension( 'TranPropAdmin' );
wfLoadExtension( 'TestYada' );
wfLoadExtension( 'NDropStatistics' );
wfLoadExtension( 'NDropTranslation' );
wfLoadExtension( 'CPStatistics' );
wfLoadExtension( 'VaniUrlRouter' );
wfLoadExtension( 'VanibotExec' );

# PrabhupadaChat (conditional loading)
if ( isset( $_GET['Chatbot'] ) && $_GET['Chatbot'] === '123' ) {
	wfLoadExtension( 'PrabhupadaChat' );
}

#----------------------------------------------------------------------
# HeadScript — inline replacement (was require_once HeadScript.php)
# Injects page-specific CSS/JS for Search, NDropTranslation, VanibotExec
#----------------------------------------------------------------------
$wgHooks['BeforePageDisplay'][] = function ( OutputPage &$out, Skin &$skin ) {
	$title = $out->getPageTitle();

	if ( $title == "Search" ) {
		$script = '
			<link rel="stylesheet" type="text/css" href="/w/extensions/VaniSearch/css/design.css?version=113">
			<link rel="stylesheet" type="text/css" href="/w/extensions/VaniSearch/css/fonts.css?version=100">
			<script type="text/javascript" src="/w/extensions/VaniSearch/js/main.js?version=118"></script>
			<script type="text/javascript" src="/w/extensions/VaniSearch/js/search.js?version=139"></script>
			<script type="text/javascript" src="/w/extensions/VaniSearch/js/design.js?version=114"></script>
			<script type="text/javascript" src="/w/extensions/VaniSearch/js/exec.js?version=140"></script>
			<script type="text/javascript" src="/w/extensions/VaniSearch/js/filt.js?version=102"></script>
			<script type="text/javascript" src="/w/extensions/VaniSearch/js/match.js?version=102"></script>
			<script type="text/javascript" src="/w/extensions/VaniSearch/js/fdbk.js?version=104"></script>
			<script type="text/javascript" src="/w/extensions/VaniSearch/js/harc.js?version=17"></script>
		';
		$out->addHeadItem( "HeadItems script", $script );
	} elseif ( $title == "Nectar Drops: Translation" ) {
		$script = '
			<link rel="stylesheet" type="text/css" href="/w/extensions/NDropTranslation/css/main.css?version=20">
			<link rel="stylesheet" type="text/css" href="/w/extensions/NDropTranslation/css/tabs.css?version=20">
			<script type="text/javascript" src="/w/extensions/NDropTranslation/js/main.js?version=1"></script>
			<script type="text/javascript" src="/w/extensions/NDropTranslation/js/ndrop.js?version=6"></script>
			<script type="text/javascript" src="/w/extensions/NDropTranslation/js/html.js?version=1"></script>
			<script type="text/javascript" src="/w/extensions/NDropTranslation/js/setup.js?version=1"></script>
			<script type="text/javascript" src="/w/extensions/NDropTranslation/js/user.js?version=1"></script>
		';
		$out->addHeadItem( "HeadItems script", $script );
	} elseif ( $title == "Vanibot execution results page edit" ) {
		$script = '
			<script type="text/javascript" src="/w/extensions/VanibotExec/js/main.js?version=14"></script>
		';
		$out->addHeadItem( "HeadItems script", $script );
	}

	return true;
};

#----------------------------------------------------------------------
# ParseExternalLinks — inline hook for YouTube Shorts links
#----------------------------------------------------------------------
function ParseExternalLinks( &$out, $parserOutput ) {
	$html = $parserOutput->getRawText();
	$html = preg_replace(
		'~<a href=["\'](https://(?:www\.)?youtube\.com/shorts/[^"]+)["\']>~',
		'<a href="$1" target="vanipediaYouTubeShorts">',
		$html
	);
	$parserOutput->setText( $html );
}
$wgHooks['OutputPageParserOutput'][] = 'ParseExternalLinks';

#----------------------------------------------------------------------
# Search
#----------------------------------------------------------------------
$wgDisableTextSearch = true;

#----------------------------------------------------------------------
# Debug (enable during testing, disable for production)
#----------------------------------------------------------------------
$wgShowExceptionDetails = true;
