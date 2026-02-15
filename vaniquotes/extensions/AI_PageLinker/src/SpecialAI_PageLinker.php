<?php
use MediaWiki\MediaWikiServices;

class SpecialAI_PageLinker extends SpecialPage {

  function __construct() {
    parent::__construct('AI_PageLinker');
  }

  function execute($par) {
    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    //if (!$user->isAllowed("editaccount")) return;

    $output = $this->getOutput();
    $this->setHeaders();
    $output->setPageTitle('AI Page Linker');
    $output->addHTML($this->genHTML());
  }

  function genHTML() {
    require(__DIR__ .'/inc/html_frame.inc');
    return html_frame();
  }
}

?>
