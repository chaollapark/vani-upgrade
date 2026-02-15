<?php
use MediaWiki\MediaWikiServices;

class SpecialAI_CategoryWrapper extends SpecialPage {

  function __construct() {
    parent::__construct('AI_CategoryWrapper');
  }

  function execute($par) {
    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    //if (!$user->isAllowed("editaccount")) return; ('wrapcategory' permission is checked in util.php)

    $output = $this->getOutput();
    $this->setHeaders();
    $output->setPageTitle('AI Category Wrapper');
    $output->addHTML($this->genHTML());
  }

  function genHTML() {
    require(__DIR__ .'/inc/html_frame.inc');
    return html_frame();
  }
}

?>
