<?php

use Wikimedia\LightweightObjectStore\ExpirationAwareness;

class VaniCategoryPage extends CategoryPage {
    protected $mCategoryViewerClass = 'VaniCategoryViewer';

    function view() {
		// From CategoryPage::view()
		 $title = $this->getTitle();
        if ( $title->inNamespace( NS_CATEGORY ) ) {
            $this->openShowCategory();
        }

        Article::view();

        if ( $title->inNamespace( NS_CATEGORY ) ) {
            $this->closeShowCategory();
        }

        # Use adaptive TTLs for CDN so delayed/failed purges are noticed less often
        $outputPage = $this->getContext()->getOutput();
        $outputPage->adaptCdnTTL(
            $this->getPage()->getTouched(),
            ExpirationAwareness::TTL_MINUTE
        );
	}
}

class VaniCategoryViewer extends CategoryViewer {
    public function __construct( $title, IContextSource $context, $from = [],
         $until = [], $query = []
     ) {
         parent::__construct($title, $context, $from, $until, $query);
         $this->limit = 15000;
     }

	function getSubcategorySection() {
        $html = parent::getSubcategorySection();
        if (count( $this->children ) >= 6 && count( $this->articles ) > 0)
            $html = str_replace("</h2>",
                '    <a href="javascript:void(0)" onclick="document.getElementsByName(\'pages\')[0].scrollIntoView({behavior: \'smooth\' ,block: \'start\', inline: \'nearest\'})" style="font-size: smaller">Pages in category</a></h2>',
                $html);
        return $html;
    }

    function getPagesSection() {
        $html = parent::getPagesSection();
        if (count( $this->children ) >= 6 && count( $this->articles ) > 0)
            $html = '<a name="pages"></a>'.$html;
        return $html;
    }
}
