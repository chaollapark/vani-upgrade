<?php
namespace MediaWiki\Extension\UserAdmin;

use SpecialPage;
use OutputPage;

class SpecialUserAdmin extends SpecialPage {

  function __construct() {
    parent::__construct('UserAdmin');
  }

  function execute($par) {

    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) return;
    if (!$user->isAllowed("editaccount")) return;    

    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.useradmin.special');
    $out->setPageTitle('User Admin');
    $this->htmlFrame($out);
  }

  function htmlFrame(OutputPage $out): void {
    $out->addHTML(
      '<div id="div_container">
         <div id="div_left">
           <div id="div_sel_petal"></div>
           <div id="div_filt_master"></div>
           <div id="div_rad_view"></div>
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
