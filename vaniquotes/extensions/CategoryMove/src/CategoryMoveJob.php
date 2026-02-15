<?php

class CategoryMoveJob extends Job {
	function __construct( $title, $params = '', $id = 0 ) {
		parent::__construct( 'categoryMove', $title, $params, $id );
	}

    function run() {
        $page = WikiPage::factory( $this->title, 0 );
		$content = $page->getContent( Revision::RAW );
		$text = ContentHandler::getContentText( $content );
        $src_cat = $this->params['src_cat'];
        $dest_cat = $this->params['dest_cat'];
		$keep_source = $this->params['keep_source'];
		$user = $this->params['user'];
		
		$text = preg_replace("/\[\[Category:$dest_cat(\|.*?)?\]\]\n?/",
			"", $text);

		if ($keep_source) {
			$pat = '/(\[\[Category:.*?\]\]\s*)+/';
			preg_match($pat, $text, $matches, PREG_OFFSET_CAPTURE);
			$text = substr($text, 0, $matches[0][1]).
				$matches[0][0].
				"[[Category:$dest_cat]]\n".
				substr($text,
					$matches[0][1]+strlen($matches[0][0]));
		}
		else {
			$text = str_ireplace(
				"[[Category:$src_cat]]",
				"[[Category:$dest_cat]]",
				$text);
			$text = str_ireplace(
				"[[Category:$src_cat|",
				"[[Category:$dest_cat|",
				$text);
		}
		$edit_summary = "Moved from category '$src_cat' to category '$dest_cat'";
		$flags = EDIT_MINOR | EDIT_UPDATE;
        $new_content = new WikitextContent( $text );
		$page->doEditContent( $new_content, $edit_summary, $flags );
    }
}
    
?>
