<?php
namespace MediaWiki\Extension\CPStat;

use SpecialPage;

class SpecialCPStat extends SpecialPage {

  function __construct() {
    parent::__construct('CPStat');
  }

  function execute($par) {
    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.cpstat.special');
    $config = $this->getRequest()->getText('config');
    $out->addJsConfigVars( 'cpstatConfig', $config );
    $out->setPageTitle('Category and Page Statistics');
    $out->addHTML('<div id="div_main"></div>');
  }
}

?>
