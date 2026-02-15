<?php
use MediaWiki\MediaWikiServices;

class SpecialVanibotExec extends SpecialPage {
  private $mysqli; 

  function __construct() {
    parent::__construct('VanibotExec');
  }

  function execute($par) {
      $output = $this->getOutput();
      $this->setHeaders();
      $output->addModules('ext.VanibotExec.styles');
      $output->setPageTitle('Vanibot execution results page edit');
      $output->addHTML($this->genHTML());
  }

  function genHTML() {
    $html = "<script type='text/javascript' src='/w/extensions/VanibotExec/js/main.js?version=16'></script>";
    $html .= "Type in bot name: ";
    $html .= "<input type='text' id='txtBotID'/><br/>";
    $html .= "Type in edit summary: ";
    $html .= "<input type='text' id='txtSummary'/>";
    $html .= "<p>&nbsp;</p>";
    $html .= "<button onclick='start()'>Start page edits</button>";
    $html .= "<p>&nbsp;</p>";
    $html .= "<div id='divOutput'></div>";
    
    return $html;
  }
}

?>
