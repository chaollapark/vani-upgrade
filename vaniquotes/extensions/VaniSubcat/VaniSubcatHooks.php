<?php
class VaniSubcatHooks {
	public static function onCategoryPageView( &$categoryArticle ) {
		$n = new VaniCategoryPage( $categoryArticle->getTitle() );
		$n->view();
		return false;
	}
}
