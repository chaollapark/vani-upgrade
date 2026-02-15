<?php

class VaniAudioHooks {
	public static function onParserFirstCallInit( $parser ) {
		$tags = VaniAudio::getPlayerTags();
		foreach ( $tags as $tag ) {
			$parser->setHook( $tag, [ 'VaniAudio', 'renderPlayerTag' ] );
		}
		return true;
	}
}
