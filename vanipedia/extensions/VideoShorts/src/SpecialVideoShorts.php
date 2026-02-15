<?php
namespace MediaWiki\Extension\VideoShorts;

use SpecialPage;

class SpecialVideoShorts extends SpecialPage {
  private $mysqli, $config;
  
  function __construct() {
    parent::__construct('VideoShorts');
    $this->config = require '/var/www/vanipedia/vanipedia.env.php';
  }

  function execute($par) {
    parent::execute($par);
    $user = $this->getUser();
    $user_id = $user->getId();
    if ($user_id == 0) return;
    $user_rights = [];
    if ($user->isAllowed("edit")) array_push($user_rights, "edit");
    if ($user->isAllowed("videoshorts")) array_push($user_rights, "videoshorts");
    $this->dbConnect();
    $session_key = $this->registerSession($user_id,$user_rights);
    
    $this->setHeaders();
    $out = $this->getOutput();
    $out->addModules('ext.videoshorts.special');
    $out->addJsConfigVars('vsSessionKey', $session_key);
    $out->setPageTitle('Video Shorts');
    $out->addHTML('<div id="div_main"></div>');
  }

  function registerSession($user_id,$user_rights) {
    require(__DIR__ .'/inc/vp_session.php');
    return reg_session($this->mysqli,$user_id,$user_rights);
  }
  
  function dbConnect() {
    $this->mysqli = new \mysqli("localhost",$this->config['DB_USER'],$this->config['DB_PASS'],"vp_translate");
    if ($this->mysqli->connect_error)
      die('Connect Error (' . $this->mysqli->connect_errno . ') ' . $this->mysqli->connect_error);
  }
}

?>
