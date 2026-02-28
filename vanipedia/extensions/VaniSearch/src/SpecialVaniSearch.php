<?php
use MediaWiki\MediaWikiServices;

class SpecialVaniSearch extends SpecialPage {
    function __construct() {
        parent::__construct('VaniSearch');
    }

    function execute($par) {
        $request = $this->getRequest();
        $output = $this->getOutput();
        $this->setHeaders();

        # Do stuff
/*  
        $output->setPageTitle('Search is temporarily unavailable');
        $output->addHTML('<br>Our new SEARCH will be available on 1st of June.<br><br>');
        $output->addHTML('<a href="https://vanisource.org/wiki/Special:VsNavigation" style="font-size: 16px; font-weight: bold;">Go to navigation >></a>');
*/
     
        $output->addModules('ext.vaniSearch.specialPage');
        $search = $request->getText('s');
        $tab = $request->getText('tab');
        $ds = $request->getText('ds');
        if (!$ds) $ds = "0";
/*        $includeHtml = file_get_contents(__DIR__ . '/_include_search.php');*/
        
        ob_start();
        require(__DIR__ . '/vs_main.php');
        $includeHtml = ob_get_contents();
        ob_end_clean();

        if (strpos($tab, "_") !== false) {
          switch ($tab[5]) {
            case "o": 
              $includeHtml = str_replace("{{search-1}}", $search, $includeHtml); 
              $includeHtml = str_replace("{{search-2}}", "", $includeHtml);
              break;
            case "t":  
              $includeHtml = str_replace("{{search-1}}", "", $includeHtml); 
              $includeHtml = str_replace("{{search-2}}", $search, $includeHtml);
            break;
          }
          $tab = substr($tab,0,4);
        }
        else {
          $includeHtml = str_replace("{{search-1}}", $search, $includeHtml);
          $includeHtml = str_replace("{{search-2}}", "", $includeHtml);
        }
        
        $includeHtml = str_replace("{{tab-sheet}}", $tab, $includeHtml);
        $includeHtml = str_replace("{{diacritic-sensitive}}", $ds, $includeHtml);
        $output->setPageTitle('Search');
        $output->addHTML($includeHtml);
    }
}
