<?php
/**
 * VaniVideo Class
 */

class VaniVideo {
	private static $allowed_baseurls = array('https://vanipedia.s3.amazonaws.com',
											 'https://s3.amazonaws.com/vanipedia',
	                                         'https://causelessmercy.com'); // Base URLs to allow
	private static $handled_tags = array('video'); // Default tags to handle
	private static $mobile = FALSE;

	public static function addModule( &$output )
	{
		if (self::isMobile())
			$output->addModules('ext.VaniVideo.mobileonly');
		else
			$output->addModules('ext.VaniVideo.nomobile');
	}
	
	/** Creates the HTML code to display
	 */
	public static function renderPlayerTag( $url, $args, $parser, $frame ) {
        
		$allowed = false;
		foreach (VaniVideo::$allowed_baseurls as $base) {
			if (strpos($url, $base) === 0) {
				$allowed = true;
				break;
			}
		}
		if (!$allowed)
			return "<div class='error'>" . wfMessage('vanivideo-invalid-source') . "</div>";

        // HTML tag properties here...

        if (strstr($url, '.mp4') !== FALSE) $type = 'video/mp4'; // Default value
        if (isset($args['type'])) {
			$type = htmlspecialchars($args['type']);
        }
        
		$width = 320;
		if (isset($args['width'])) {
			$width = htmlspecialchars($args['width']);
        }
        
		$height = 240;
		if (isset($args['height'])) {
			$height = htmlspecialchars($args['height']);
        }
        
		$mobilewidth = $width;
		if (isset($args['mobilewidth'])) {
			$mobilewidth = htmlspecialchars($args['mobilewidth']);
        }
        
		$mobileheight = $height;
		if (isset($args['mobileheight'])) {
			$mobileheight = htmlspecialchars($args['mobileheight']);
        }
        
		$autoplay = "";
		if (isset($args['autoplay'])) {
			$autoplay = " autoplay";
        }
		
		$muted = "";
		if (isset($args['muted'])) {
			$muted = " muted";
        }
		
		$loop = "";
		if (isset($args['loop'])) {
			$loop = " loop";
        }
		
		$poster = "";
		if (isset($args['poster'])) {
			$posterUrl = '/w/images/'.htmlspecialchars($args['poster']);
			$poster = " poster=\"".$posterUrl."\"";
        }
		
		$preload = "";
		if (isset($args['preload'])) {
			$preload = " preload=\"".htmlspecialchars($args['preload'])."\"";
        }
        
        // ...

		$html = "<video"."$preload$autoplay$loop$muted$poster width=\"$width\" height=\"$height\" controls><source src='$url' type='$type'/></video>";
		if ($width != $mobilewidth || $height != $mobileheight)
		{
			$htmlmobile = "<video"."$preload$autoplay$loop$muted$poster width=\"$mobilewidth\" height=\"$mobileheight\" controls><source src='$url' type='$type'/></video>";
			$html = "<div class='nomobile'>$html</div><div class='mobileonly'>$htmlmobile</div>";
		}
		if (isset($args['center']))
			$html = "<div class=\"center\">$html</div>";
		return $html;
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

	/** Return whether this is mobile view, must be set in LocalSettings.php in accordance with mobile detect */
	public static function isMobile() {
		return self::$mobile;
	}

	/** Support getting settings from global variable - $wgVaniVideoSettings */
	public static function initFromGlobals() {
		global $wgVaniVideoSettings;
		
		if (isset($wgVaniVideoSettings['tags'])) {
			self::setPlayerTags($wgVaniVideoSettings['tags']);
		}
		if (isset($wgVaniVideoSettings['mobile'])) {
			self::$mobile = TRUE;
		}
	}
}
