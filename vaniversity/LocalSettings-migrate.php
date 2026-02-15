<?php
if ( defined( 'MW_INSTALL_PATH' ) ) { $IP = MW_INSTALL_PATH; } else { $IP = dirname( __FILE__ ); }
$wgSitename = "Vaniversity";
$wgServer = "http://localhost:8089";
$wgScriptPath = "/w";
$wgDBtype = "mysql";
$wgDBserver = "mariadb-prod";
$wgDBname = "vaniversity";
$wgDBuser = "admin";
$wgDBpassword = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix = "vaniversity_";
$wgDBTableOptions = "ENGINE=InnoDB, DEFAULT CHARSET=binary";
$wgSecretKey = "aeec6b3616d9eea43af2abb75ec18739bca26601862cc286f611567496048275";
$wgMainCacheType = CACHE_NONE;
$wgLanguageCode = "en";
$wgShowExceptionDetails = true;
