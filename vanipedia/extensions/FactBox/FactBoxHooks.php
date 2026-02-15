<?php

class FactBoxHooks {
	public static function onOutputPageParserOutput( $out, $parserOutput ) {
		$title = $parserOutput->getTitleText();
		if ( strpos( $title, "Yada test" ) === false ) {
			return;
		}
		$html = $parserOutput->getRawText();
		if ( preg_match( "/Compiler/", $html ) ) {
			$html .= "<div>FACT BOX</div>";
		}
		$parserOutput->setText( $html );
	}
}
