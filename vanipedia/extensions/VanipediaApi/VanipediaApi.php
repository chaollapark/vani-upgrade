<?php
// API extension for Vanipedia, includes:
// * Quote by date - with link into Vanisource
define( 'MW_EXT_VANIAPI_NAME',            'VaniApi' );
define( 'MW_EXT_VANIAPI_VERSION',         '1.0.0' );
define( 'MW_EXT_VANIAPI_AUTHOR',          'Elad Stern' );
define( 'MW_EXT_VANIAPI_KEY',             '382963-8FA876C-098F6CD5A2' );

define( 'MW_EXT_QUOTEBYDATE_PARAM_NAME',      'quotebydate' );
define( 'MW_EXT_QUOTEBYDATE_API_MID',         'qbd' );

define( 'MW_EXT_QUOTEBYDATE_API_QUERY_CLASS', 'ApiQueryQuoteByDate' );

define( 'MW_EXT_RANDOMVIDEO_PARAM_NAME',      'randomvideo' );
define( 'MW_EXT_RANDOMVIDEO_API_MID',         'rv' );

define( 'MW_EXT_RANDOMVIDEO_API_QUERY_CLASS', 'ApiQueryRandomVideo' );

global $wgAPIListModules, $wgAutoloadClasses, $wgExtensionCredits;

$wgExtensionCredits['api'][] = array(
	'path' => __DIR__ . '/' . MW_EXT_VANIAPI_NAME,
	'name'         => MW_EXT_VANIAPI_NAME,
	'description'  => 'Provide data for external websites that connect to Vanipedia',
	'version'      => MW_EXT_VANIAPI_VERSION,
	'author'       => MW_EXT_VANIAPI_AUTHOR,
	'url'          => 'https://vanipedia.org/wiki/Extension:VanipediaApi',
);

// API declarations

// action=query&prop=quotebydate
$wgAPIListModules[MW_EXT_QUOTEBYDATE_PARAM_NAME] = MW_EXT_QUOTEBYDATE_API_QUERY_CLASS;
$wgAutoloadClasses[MW_EXT_QUOTEBYDATE_API_QUERY_CLASS] =
	 __DIR__ . '/' . MW_EXT_QUOTEBYDATE_API_QUERY_CLASS . '.php';

// action=query&prop=randomvideo
$wgAPIListModules[MW_EXT_RANDOMVIDEO_PARAM_NAME] = MW_EXT_RANDOMVIDEO_API_QUERY_CLASS;
$wgAutoloadClasses[MW_EXT_RANDOMVIDEO_API_QUERY_CLASS] =
	 __DIR__ . '/' . MW_EXT_RANDOMVIDEO_API_QUERY_CLASS . '.php';
?>