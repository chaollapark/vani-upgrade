<?php
namespace MediaWiki\Extension\TestYada;

use SpecialPage;

class SpecialTestYada extends SpecialPage {
    public function __construct() {
        parent::__construct( 'TestYada' );
    }

    public function execute( $subPage ) {
        $this->setHeaders();
        $out = $this->getOutput();
        $out->addModules( 'ext.testyada.special' );
        
        $out->addJsConfigVars( [
          'wgTestYadaUserName' => $this->getUser()->getName(),
          'wgTestYadaCanEdit'  => $this->getUser()->isAllowed('edit'),
          'wgTestYadaLimit'    => 50
        ] );
        // $out->addHTML('<div id="testyada-root"></div>');
        //$out->addWikiTextAsContent( 'Hare Krsna' );
    }
}
?>