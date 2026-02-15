<?php
namespace MediaWiki\Extension\NDropStat;

use SpecialPage;

class SpecialNDropStat extends SpecialPage {

  function __construct() {
    parent::__construct('NDropStat');
  }

  public function execute($subPage): void {
    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.ndropstat.special');
    $config = $this->getRequest()->getText('config');
    $out->addJsConfigVars('ndropstatConfig', $config);
    $out->setPageTitle('Nectar Drops: Statistics');
    $out->addHTML('<div id="div_main"></div>');
  }
}

?>
