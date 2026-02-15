<?php
namespace MediaWiki\Extension\LangAdmin;

use SpecialPage;
use OutputPage;

class SpecialLangAdmin extends SpecialPage {

  function __construct() {
    parent::__construct('LangAdmin');
  }

  function execute($par) {

    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    if (!$user->isAllowed("editaccount")) return;

    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.langadmin.special');
    $out->setPageTitle('Language Admin');
    $this->htmlFrame($out);
  }

  function htmlFrame(OutputPage $out): void {
    $out->addHTML(
    '<div id="div_container">
       <div id="div_left" style="display:none">
         <div id="div_filt_master"></div>
       </div>
       <div id="div_right"></div>
       <div id="div_rad_display"></div>
     </div>
     <div id="div_master"></div>
     <div id="div_detail"></div>
    
     <div id="div_modal" class="modal">
       <div class="modal-content">
         <span id="spn_modal_close" class="close">&times;</span>
         <span id="spn_modal_title"></span>
         <div id="div_modal_table"></div>
         <div id="div_modal_footer"></div>
       </div>
     </div>');
  }
}

?>
