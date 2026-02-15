<?php
namespace MediaWiki\Extension\RevManager;

use SpecialPage;
use OutputPage;

class SpecialRevManager extends SpecialPage {

  function __construct() {
    parent::__construct('RevManager');
  }

  function execute($par) {

    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    if (!$user->isAllowed("revmanage")) return;

    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.revmanager.special');
    $out->setPageTitle('Revision Manager');
    $this->htmlFrame($out);
  }
  
  function htmlFrame(OutputPage $out) {
    $out->addHTML(
      '<div id="div_container">
         <div id="div_left">
           <div id="div_sel_petal"></div>
           <div id="div_rad_nspace"></div>
           <div id="div_rad_type"></div>
           <div style="clear:both;"></div>
           <div id="div_total"></div>
           <div id="div_navig"></div>
         </div>
         <div id="div_right"></div>
       </div>
       <div id="div_table"></div>
       <div id="div_history"></div>'
    );
  }

}

?>
