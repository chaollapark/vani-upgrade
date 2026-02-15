<?php
namespace MediaWiki\Extension\QuotesAdmin;

use SpecialPage;

class SpecialQuotesAdmin extends SpecialPage {

  function __construct() {
    parent::__construct('QuotesAdmin');
  }

  function execute($par) {
    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    if (!$user->isAllowed("editaccount")) return;

    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.quotesadmin.special');
    $out->setPageTitle('Quotes Admin');
    $out->addHTML('<div id="div_main"></div>');
  }

}

?>
