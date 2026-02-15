<?php

class MarkTermsHooks {
	public static function onOutputPageParserOutput( &$out, $parserOutput ) {
		$html = $parserOutput->getRawText();
		$isCompilation = strpos( $html, '<div id="compilation">' ) !== false;
		$hasHLQS = isset( $_GET["hl"] );
		$isVaniquotes = isset( $_SERVER['SERVER_NAME'] ) && strpos( $_SERVER['SERVER_NAME'], "vaniquotes" ) !== false;
		$terms = '';

		if ( $hasHLQS ) {
			$terms = $_GET["hl"];
		} elseif ( $isVaniquotes ) {
			self::handleHTMLEntities( $html );
			$termsArr = self::findTermsOnPage( $html );
			$terms = implode( "|", $termsArr );
		}

		if ( $terms ) {
			self::highlightTerms( $terms, $html );
			if ( !$isVaniquotes && !$isCompilation ) {
				self::addAutoScrollScript( $html );
			} else {
				self::addTermsToLinks( $html );
			}
			$parserOutput->setText( $html );
		}
	}

	private static function handleHTMLEntities( &$html ) {
		$html = preg_replace( '/(?<!\s)(?:&nbsp;|&#160;)+(?!\s)/', ' ', $html );
	}

	private static function findTermsOnPage( $html ) {
		$terms = [];
		if ( preg_match_all( '/<span class=[\'"]terms[\'"]>(.*?)<\/span>/', $html, $matches, PREG_PATTERN_ORDER ) ) {
			foreach ( $matches[1] as $elTerms ) {
				preg_match_all( '/"+(.*?)"+/', $elTerms, $matches, PREG_PATTERN_ORDER );
				$terms = array_merge( $terms, $matches[1] );
			}
		}
		return $terms;
	}

	private static function findQuoteLinks( $html, $linkMatches, $urlMatches ) {
		$quoteMatches = [];
		$resUrlMatches = [];
		if ( preg_match_all( '/<div.*? class=["\']quote["\'].*?>/', $html, $matches, PREG_OFFSET_CAPTURE ) ) {
			$quoteMatches = $matches[0];
			foreach ( $quoteMatches as $quoteMatch ) {
				$posQuote = $quoteMatch[1];
				foreach ( $linkMatches as $iLink => $linkMatch ) {
					$posLink = $linkMatch[1];
					if ( $posLink > $posQuote ) {
						$resUrlMatches[] = $urlMatches[$iLink];
						break;
					}
				}
			}
		}
		if ( count( $resUrlMatches ) == 0 ) {
			return $urlMatches;
		} else {
			return $resUrlMatches;
		}
	}

	private static function addTermsToLinks( &$html ) {
		if ( preg_match_all( '/<a href=["\'](.*?vanisource\.org.*?)["\']/', $html, $matches, PREG_OFFSET_CAPTURE ) ) {
			$urlMatches = self::findQuoteLinks( $html, $matches[0], $matches[1] );

			array_push( $urlMatches, [ '', strlen( $html ) ] );
			$res_html = substr( $html, 0, $urlMatches[0][1] );
			foreach ( $urlMatches as $i => $match ) {
				$url = $match[0];
				if ( $url == "" ) {
					continue;
				}
				$posStart = $match[1];
				$posEnd = $urlMatches[$i + 1][1];
				$extract_area = substr( $html, $posStart, $posEnd - $posStart );
				if ( preg_match_all( '/<span class=\'hlterm\'>(.*?)<\/span>/', $extract_area, $matches, PREG_PATTERN_ORDER ) ) {
					$terms = implode( "|", array_unique( $matches[1] ) );
					$url_len = strlen( $url );
					$res_html .=
						"$url?hl=$terms" .
						substr( $html, $posStart + $url_len, $posEnd - ( $posStart + $url_len ) );
				} else {
					$res_html .= substr( $html, $posStart, $posEnd - $posStart );
				}
			}
			$html = $res_html;
		}
	}

	private static function findNoHighlightZones( $html ) {
		$no_hl_zones = [];
		self::mbRegMatchAll( '<mw:.*?>.*?<\/mw:.*?>', $html, $matches, 0, 'm' );
		self::mbRegMatchAll(
			'(<(?:div|span) (?:style=["\']float|class=["\'](?:quote_)?heading["\']).*?<\/(?:div|span)>|' .
			'<span class=[\'"]terms[\'"].*?<\/span>|<a href.*?<\/a>)',
			$html, $matches_cont, 0, 'm'
		);
		$matches = array_merge( $matches, $matches_cont );
		foreach ( $matches as $match ) {
			if ( substr_count( $match[1], "mw:toc" ) < 2 && substr_count( $match[1], "<div" ) >= 2 ) {
				continue;
			}
			$no_hl_zones[] = [
				"start" => $match[0],
				"end" => $match[0] + strlen( $match[1] )
			];
		}
		return $no_hl_zones;
	}

	private static function makeTermsRegex( $terms, $htmlTags = false, $addParen = false ) {
		$termDiacDict = [
			'N' => 'ÑṄṆ',
			'n' => 'ñṅṇ',
			'A' => 'Ā',
			'a' => 'ā',
			'I' => 'Ī',
			'i' => 'ī',
			'S' => 'ŚṢ',
			's' => 'śṣ',
			'U' => 'Ū',
			'u' => 'ū',
			'D' => 'Ḍ',
			'd' => 'ḍ',
			'H' => 'Ḥ',
			'h' => 'ḥ',
			'L' => 'Ḷ',
			'l' => 'ḷl̐',
			'M' => 'Ṁ',
			'm' => 'ṁ',
			'R' => 'ṚṜ',
			'r' => 'ṛṝ',
			'T' => 'Ṭ',
			't' => 'ṭ'
		];
		$re = "";
		for ( $i = 0; $i < strlen( $terms ); $i++ ) {
			$chr = $terms[$i];
			if ( isset( $termDiacDict[$chr] ) ) {
				$re .= "[{$termDiacDict[$chr]}$chr]";
			} else {
				$re .= $chr;
			}
		}
		$re = preg_replace_callback( '/[?()*+]/', function ( $matches ) {
			return "\\" . $matches[0];
		}, $re );
		if ( $htmlTags ) {
			$re = preg_replace( "/[ ,;.\-]/", "(?:<\\/?[aiub].*?>|[ ,;.\-])+", $re );
		} else {
			$re = preg_replace( '/[ ,;.\-]+/', "[ ;,.\-]*", $re );
		}
		$re = mb_ereg_replace( '["‟„""]', '["‟„""]', $re );
		$re = mb_ereg_replace( "[''‚‛']", "[''‚‛']", $re );
		return "\W($re)\W";
	}

	private static function mbRegMatchAll( $pat, $text, &$matches, $grp, $opts = '' ) {
		$matches = [];
		mb_regex_set_options( $opts );
		$c = 0;
		mb_ereg_search_init( $text, $pat );
		$pos = mb_ereg_search_pos();
		while ( $pos && $c++ < 10000 ) {
			$regs = mb_ereg_search_getregs();
			$hit = [
				$pos[0] + strlen( mb_substr( $regs[0], 0, 1 ) ),
				$regs[$grp]
			];
			$matches[] = $hit;
			mb_ereg_search_setpos( $pos[0] + $pos[1] - 1 );
			$pos = mb_ereg_search_pos();
		}
	}

	private static function highlightTerms( $terms, &$html ) {
		$no_hl_zones = self::findNoHighlightZones( $html );
		$re = self::makeTermsRegex( $terms );
		self::mbRegMatchAll( $re, $html, $matches, 1, 'i' );
		if ( count( $matches ) == 0 ) {
			$re = self::makeTermsRegex( $terms, true );
			self::mbRegMatchAll( $re, $html, $matches, 1, 'i' );
		}
		foreach ( $matches as $i => $match ) {
			$excluded = false;
			foreach ( $no_hl_zones as $zone ) {
				if ( $match[0] >= $zone['start'] && $match[0] <= $zone['end'] ) {
					$excluded = true;
					break;
				}
			}
			$matches[$i][2] = !$excluded;
		}
		$res_html = "";
		$pos = 0;
		foreach ( $matches as $match ) {
			$res_html .= substr( $html, $pos, $match[0] - $pos );
			if ( $match[2] ) {
				$res_html .= "<span class='hlterm'>" . $match[1] . "</span>";
			} else {
				$res_html .= $match[1];
			}
			$pos = $match[0] + strlen( $match[1] );
		}
		$res_html .= substr( $html, $pos );
		$html = $res_html;
	}

	private static function addAutoScrollScript( &$html ) {
		$html .= "<script type='text/javascript'>" .
			"var el = document.querySelector('span.hlterm');" .
			"if(el){el.scrollIntoView({" .
			"behavior:'smooth', block: 'center', inline: 'center'" .
			"});}</script>";
	}
}
