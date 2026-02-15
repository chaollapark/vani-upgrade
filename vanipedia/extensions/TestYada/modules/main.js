( function () {
    'use strict';

    function init() {
        console.log( 'init() called' );
        // your page setup code here
    }

    // Run after DOM is ready
    $( init );
}() );

const userName = mw.config.get( 'wgTestYadaUserName' );
const canEdit  = mw.config.get( 'wgTestYadaCanEdit' );
const limit    = mw.config.get( 'wgTestYadaLimit' );

console.log( userName, canEdit, limit );

