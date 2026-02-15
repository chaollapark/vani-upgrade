<?php
if ( defined( 'MW_INSTALL_PATH' ) ) { $IP = MW_INSTALL_PATH; } else { $IP = dirname( __FILE__ ); }
$wgSitename = "Vanictionary";
$wgServer = "http://localhost:8088";
$wgScriptPath = "/w";
$wgDBtype = "mysql";
$wgDBserver = "mariadb-prod";
$wgDBname = "vanictionary";
$wgDBuser = "admin";
$wgDBpassword = getenv('MW_DB_PASSWORD') ?: "PLACEHOLDER";
$wgDBprefix = "vanictionary_";
$wgDBTableOptions = "ENGINE=InnoDB, DEFAULT CHARSET=binary";
$wgSecretKey = "729b7bc268944c310315d4ef36b79fba06012f240a893266a8b1f0a2ee499761";
$wgMainCacheType = CACHE_NONE;
$wgLanguageCode = "en";
$wgShowExceptionDetails = true;
