<?php
namespace MediaWiki\Extension\TranPropAdmin;

use SpecialPage;

class SpecialTranPropAdmin extends SpecialPage {

  function __construct() {
    parent::__construct('TranPropAdmin');
  }

  function execute($par) {
    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    if (!$user->isAllowed("editaccount")) return;
    
    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.tranpropadmin.special');
    $out->setPageTitle('Translation Properties Admin');
    $out->addHTML('<div id="div_main"></div>');
  }

}

?>
