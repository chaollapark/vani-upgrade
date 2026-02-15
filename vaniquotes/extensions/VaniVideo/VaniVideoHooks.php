<?php

class VaniVideoHooks {
	public static function onParserFirstCallInit( $parser ) {
		$tags = VaniVideo::getPlayerTags();
		foreach ( $tags as $tag ) {
			$parser->setHook( $tag, [ 'VaniVideo', 'renderPlayerTag' ] );
		}
		return true;
	}

	public static function onBeforePageDisplay( &$output, &$skin ) {
		return VaniVideo::addModule( $output );
	}
}
