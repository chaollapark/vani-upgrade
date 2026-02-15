<?php
class VaniquotesApiSetup {
	public static function onRegistration() {
		define( 'MW_EXT_VANIAPI_NAME', 'VaniApi' );
		define( 'MW_EXT_VANIAPI_VERSION', '1.0.0' );
		define( 'MW_EXT_VANIAPI_AUTHOR', 'Elad Stern' );
		define( 'MW_EXT_VANIAPI_KEY', '120983-8FA876C-098F6CD5A2' );
		define( 'MW_EXT_RANDOMQUOTE_PARAM_NAME', 'randomquote' );
		define( 'MW_EXT_RANDOMQUOTE_API_MID', 'rq' );
		define( 'MW_EXT_RANDOMQUOTE_API_QUERY_CLASS', 'ApiQueryRandomQuote' );
	}
}
