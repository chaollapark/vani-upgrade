<?php
namespace MediaWiki\Extension\CategoryAdmin;

use SpecialPage;

class SpecialCategoryAdmin extends SpecialPage {

  function __construct() {
    parent::__construct('CategoryAdmin');
  }
  
  public function execute($subPage): void {
    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    if (!$user->isAllowed("editaccount")) return;

    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.categoryadmin.special');
    $out->setPageTitle('Category Admin');
    $out->addHTML('<div id="div_main"></div>');
  }

}

?>
