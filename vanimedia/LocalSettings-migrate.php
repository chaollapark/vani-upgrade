<?php
# Temporary LocalSettings for MW 1.35→1.39 intermediate migration
if ( defined( 'MW_INSTALL_PATH' ) ) {
	$IP = MW_INSTALL_PATH;
} else {
	$IP = dirname( __FILE__ );
}

$wgSitename = "Vanimedia";
$wgServer = "http://localhost:8086";
$wgScriptPath = "/w";

$wgDBtype     = "mysql";
$wgDBserver   = "mariadb-prod";
$wgDBname     = "vanimedia";
$wgDBuser     = "admin";
$wgDBpassword = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix   = "vanimedia_";
$wgDBTableOptions = "ENGINE=InnoDB, DEFAULT CHARSET=binary";

$wgSecretKey = "53d831b48749482f761f55f96ec30f7ef2994c06829d95087144c501d26ca384";
$wgMainCacheType = CACHE_NONE;
$wgLanguageCode = "en";
$wgShowExceptionDetails = true;
