<?php
use MediaWiki\MediaWikiServices;

class SpecialVaniNavigation extends SpecialPage {
  function __construct() {
    parent::__construct('VaniNavigation');
  }

  function execute($par) {
    $request = $this->getRequest();
    $output = $this->getOutput();
    $this->setHeaders();

    # Get request data from, e.g.
    $param = $request->getText( 'param' );

    # Do stuff
        
    $output->addModules('ext.vaniNavigation.specialPage');

    $includeHtml = file_get_contents(__DIR__ . '/_include_navigation.php'); 
        
    $output->setPageTitle('Navigation');

    $output->addHTML($includeHtml);
  }
}
?>
