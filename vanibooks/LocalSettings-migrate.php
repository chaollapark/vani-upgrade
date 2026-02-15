<?php
if ( defined( 'MW_INSTALL_PATH' ) ) { $IP = MW_INSTALL_PATH; } else { $IP = dirname( __FILE__ ); }
$wgSitename = "Vanibooks";
$wgServer = "http://localhost:8087";
$wgScriptPath = "/w";
$wgDBtype = "mysql";
$wgDBserver = "mariadb-prod";
$wgDBname = "vanibooks";
$wgDBuser = "admin";
$wgDBpassword = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix = "vanibooks_";
$wgDBTableOptions = "ENGINE=InnoDB, DEFAULT CHARSET=binary";
$wgSecretKey = "e94c6738c000bc1846a308c365d0e6d0d469d3d701a1e4d261e5141ef3d120ee";
$wgMainCacheType = CACHE_NONE;
$wgLanguageCode = "en";
$wgShowExceptionDetails = true;
