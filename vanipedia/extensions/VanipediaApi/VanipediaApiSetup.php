<?php

class VanipediaApiSetup {
	public static function onRegistration() {
		if ( !defined( 'MW_EXT_VANIAPI_KEY' ) ) {
			define( 'MW_EXT_VANIAPI_KEY', '382963-8FA876C-098F6CD5A2' );
		}
		if ( !defined( 'MW_EXT_QUOTEBYDATE_API_MID' ) ) {
			define( 'MW_EXT_QUOTEBYDATE_API_MID', 'qbd' );
		}
		if ( !defined( 'MW_EXT_RANDOMVIDEO_API_MID' ) ) {
			define( 'MW_EXT_RANDOMVIDEO_API_MID', 'rv' );
		}
	}
}
