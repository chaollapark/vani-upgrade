<?php
namespace MediaWiki\Extension\ImportArticles;

use SpecialPage;

class SpecialImportArticles extends SpecialPage {

  function __construct() {
    parent::__construct('ImportArticles');
  }

  function execute($par) {
    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    if (!$user->isAllowed("editaccount")) return;    

    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.importarticles.special');
    $out->setPageTitle('Import Articles');
    $out->addHTML('
      <div id="div_main">
        <div id="div_header"></div>
        <div id="div_files"></div>
      </div>');
  }

}
