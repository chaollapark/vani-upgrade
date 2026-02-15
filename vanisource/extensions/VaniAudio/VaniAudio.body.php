<?php
/**
 * VaniAudio Class
 */

class VaniAudio {
	private static $allowed_baseurls = array('https://vanipedia.s3.amazonaws.com',
											 'https://s3.amazonaws.com/vanipedia',
											 'https://s3.amazonaws.com/audio-fixing-project',
	                                         'https://causelessmercy.com'); // Base URLs to allow
    private static $handled_tags = array('player'); // Default tags to handle
	
	/** Creates the HTML code to display
	 */
	public static function renderPlayerTag( $url, $args, $parser, $frame ) {
        
        // Currently support only .mp3
        if (strstr($url, '.mp3') === FALSE)
            return "<div class='error'>" . wfMessage('vaniaudio-invalid-url') . "</div>";

		$allowed = false;
		foreach (VaniAudio::$allowed_baseurls as $base) {
			if (strpos($url, $base) === 0) {
				$allowed = true;
				break;
			}
		}
		if (!$allowed)
			return "<div class='error'>" . wfMessage('vaniaudio-invalid-source') . "</div>";

        // HTML tag properties here...

        if (strstr($url, '.mp3') !== FALSE) $type = 'audio/mpeg'; // Default value
        if (isset($args['type'])) {
			$type = htmlspecialchars($args['type']);
        }
        
		$preload = "";
		if (isset($args['preload'])) {
			$preload = " preload=\"".htmlspecialchars($args['preload'])."\"";
        }
        
        // ...

		return "<audio"."$preload controls><source src='$url' type='$type'/></audio>";
	}
	
	/** Set the tags to handle (default: "player")
	 * @param array|string $tags - Either an array of tags (e.g. <code>array('player','play')</code>) or a single string tag (e.g. <code>'player'</code>).
	 */
	public static function setPlayerTags( $tags ) {
		if (!empty($tags)) {
			if (is_array($tags)) { // if array
				self::$handled_tags = $tags;
			} elseif (is_string($tags)) { // if string, make array
				self::$handled_tags = array($tags);
			}
		}
		// if empty or wrong type, do nothing.
	}
	
	/** Return array of the tags to handle */
	public static function getPlayerTags() {
		return self::$handled_tags;
	}

	/** Support getting settings from global variable - $wgAudioPlayer2Settings */
	public static function initFromGlobals() {
		global $wgVaniAudioSettings;
		
		if (isset($wgVaniAudioSettings['tags'])) {
			self::setPlayerTags($wgVaniAudioSettings['tags']);
		}
	}
}
