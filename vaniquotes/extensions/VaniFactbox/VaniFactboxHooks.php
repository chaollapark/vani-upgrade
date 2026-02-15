<?php
class VaniFactboxHooks {
	private static function formatDate( $rawDate ) {
		if ( preg_match( '/([0-9]{1,2})([A-Za-z]{3})([0-9]{1,2})/', $rawDate, $matches ) ) {
			return "{$matches[1]} of {$matches[2]}, 20{$matches[3]}";
		} else {
			$parts = explode( "T", $rawDate );
			$date = $parts[0];
			$time = substr( $parts[1], 0, -1 );
			return "{$date}, {$time}";
		}
	}

	public static function onArticleViewFooter( Article $article, bool $patrolFooterShown ) {
		global $gFactboxHTML;

		if ( !$article || !$article->getTitle() ) {
			return;
		}

		$ns = $article->getTitle()->getNamespace();
		if ( $ns !== 0 ) {
			return;
		}

		$content = $article->getPage()->getContent();
		if ( !$content ) {
			return;
		}
		$wikiText = $content->getText();

		if ( $wikiText ) {
			$factText = substr( $wikiText, 0, strpos( $wikiText, "[[" ) );
			preg_match_all( '/\{\{([^|]+)\|([^}]+)\}\}/', $factText, $matches, PREG_SET_ORDER );

			$pageTitle = htmlspecialchars( $article->getTitle()->getText() );
			$html = "";
			$alt = true;
			$altClass = $alt ? ' st-alt' : '';
			$html .= "<tr><td class='factName$altClass' style='vertical-align:top'>Page Title:</td><td class='factValue$altClass'>$pageTitle</td></tr>";
			$showFactbox = false;

			foreach ( $matches as $match ) {
				$key = $match[1];
				$value = $match[2];
				$showFact = true;
				$factName = "";
				$factValue = htmlspecialchars( $value );

				switch ( $key ) {
					case "compiler":
						$factName = "Compiler";
						$factValue = htmlspecialchars( implode( ", ", explode( "|", $value ) ) );
						break;
					case "first":
						$factName = "Created";
						$factValue = htmlspecialchars( self::formatDate( $value ) );
						break;
					case "totals_by_section":
						$factName = "Totals by Section";
						$parts = explode( '|', $value );
						$wrapped = array_map( function ( $v ) {
							return "<span>" . htmlspecialchars( $v ) . "</span>";
						}, $parts );
						$factValue = implode( ', ', $wrapped );
						break;
					case "total":
						$factName = "No. of Quotes";
						break;
					default:
						$showFact = false;
				}

				if ( $showFact ) {
					$alt = !$alt;
					$altClass = $alt ? ' st-alt' : '';
					$html .= "<tr><td class='factName$altClass'>$factName:</td><td class='factValue$altClass'>$factValue</td></tr>";
					$showFactbox = true;
				}
			}

			if ( $showFactbox ) {
				$gFactboxHTML = "<div class='factbox'><table class='statstable'>$html</table></div>";
			} else {
				$gFactboxHTML = "";
			}
		}
	}
}
