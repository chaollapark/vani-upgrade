<?php
/**
 * Vanibooks LocalSettings.php — MediaWiki 1.43 LTS (Docker upgrade)
 * Migrated from MW 1.23.5
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
$wgSitename         = "Vanibooks";
$wgServer           = 'http://localhost:8087';
$wgScriptPath       = "/w";
$wgArticlePath      = '/wiki/$1';
$wgUsePathInfo      = true;

#----------------------------------------------------------------------
# Database settings — Docker networking to mariadb-prod container
#----------------------------------------------------------------------
$wgDBtype           = "mysql";
$wgDBserver         = "mariadb-prod";
$wgDBname           = "vanibooks";
$wgDBuser           = "admin";
$wgDBpassword       = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix         = "vanibooks_";
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
$wgEmergencyContact = "webservant@vanibooks.org";
$wgPasswordSender   = "webservant@vanibooks.org";
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
$wgFileExtensions      = [ 'png', 'gif', 'jpg', 'jpeg', 'mp3', 'svg' ];

# Shared uploads from vanimedia
$wgUseSharedUploads        = true;
$wgSharedUploadPath        = "/w/shared-images";
$wgFetchCommonsDescriptions = false;
$wgSharedUploadDirectory   = "/var/www/html/w/shared-images";
$wgSharedUploadDBname      = 'vanimedia';
$wgSharedUploadDBprefix    = 'vanimedia_';
$wgCacheSharedUploads      = true;

#----------------------------------------------------------------------
# Skin — Vector (default)
#----------------------------------------------------------------------
$wgDefaultSkin = 'vector';

#----------------------------------------------------------------------
# Licensing / copyright
#----------------------------------------------------------------------
$wgRightsPage = "";
$wgRightsUrl  = "";
$wgRightsText = "";

#----------------------------------------------------------------------
# Appearance
#----------------------------------------------------------------------
$wgLogo    = '/w/images/Vanibooks-logo-small.png';
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
# Permissions — load from global file
#----------------------------------------------------------------------
require_once( "$IP/global/permissions.php" );

$wgAllowUserJs  = true;
$wgAllowUserCss = true;

#----------------------------------------------------------------------
# Extensions
#----------------------------------------------------------------------

# Bundled in MW 1.43
wfLoadExtension( 'CategoryTree' );
wfLoadExtension( 'ImageMap' );
wfLoadExtension( 'InputBox' );
wfLoadExtension( 'Interwiki' );
wfLoadExtension( 'ParserFunctions' );
$wgPFEnableStringFunctions = true;

# Non-bundled
wfLoadExtension( 'CharInsert' );
wfLoadExtension( 'Loops' );
wfLoadExtension( 'RandomImage' );
wfLoadExtension( 'RandomSelection' );
wfLoadExtension( 'EmbedVideo' );
wfLoadExtension( 'IframePage' );
$wgIframePageSrc = [
	'Donating to Vanipedia' => 'https://cdn.donately.com/dntly-core/1.4/iframe.html?donately_id=act_b5b0f2a4601b&donately_presets=10,15,25,50&stripe_publishable_key=pk_live_c9gzjyh3VHuHcbOe8D0Yy4SN&donately_anonymous=true&donately_amount=108'
];

#----------------------------------------------------------------------
# Inline dropdown menus hook (replaces HeadScript + hellobar)
#----------------------------------------------------------------------
$wgHooks['BeforePageDisplay'][] = function ( OutputPage &$out, Skin &$skin ) {
	global $wgRequest;
	if ( $wgRequest->getText( 'action' ) || $wgRequest->getText( 'returnto' ) ) {
		return true;
	}
	$script = '
		<link rel="stylesheet" type="text/css" href="https://vanipedia.org/editmenu/css/fonts.css?version=1">
		<script type="text/javascript" src="https://vanipedia.org/editmenu/js/shrd.js?version=88"></script>
	';
	$out->addHeadItem( "HeadItems script", $script );
	return true;
};

#----------------------------------------------------------------------
# Debug
#----------------------------------------------------------------------
$wgShowExceptionDetails = true;
