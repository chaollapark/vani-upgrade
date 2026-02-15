<?php
namespace MediaWiki\Extension\SearchAdmin;

use SpecialPage;

class SpecialSearchAdmin extends SpecialPage {

  function __construct() {
    parent::__construct('SearchAdmin');
  }

  function execute($par) {

    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    if (!$user->isAllowed("editaccount")) return;

    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.searchadmin.special');
    $out->setPageTitle('Search Admin');
  }
}

?>
