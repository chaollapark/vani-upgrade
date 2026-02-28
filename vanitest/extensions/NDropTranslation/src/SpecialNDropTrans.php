<?php
use MediaWiki\MediaWikiServices;

class SpecialNDropTrans extends SpecialPage {
  private $mysqli, $config;

  function __construct() {
    parent::__construct("NDropTrans");
    $configFile = is_readable("/var/www/vanitest/vanitest.env.php")
      ? "/var/www/vanitest/vanitest.env.php"
      : "/var/www/vanipedia/vanipedia.env.php";
    $this->config = require $configFile;
  }

  function execute($par) {
    $this->mysqli = $this->db_connect();
    if ($par == "upd_setup") {
      $this->upd_setup();
    } elseif ($par == "reg_ndcr") {
      $this->reg_ndcr();
    } else {
      $output = $this->getOutput();
      $this->setHeaders();
      $output->addModules("NDropTrans");
      $output->setPageTitle("Nectar Drops: Translation");
      $output->addHTML($this->genHTML());
    }
  }

  function genHTML() {
    require(__DIR__ . "/inc/do_refresh.inc");
    require(__DIR__ . "/inc/ndt_html.inc");
    do_refresh($this->mysqli);
    $html = do_html($this->mysqli);
    return $html;
  }

  function upd_setup() {
    global $wgOut;
    $wgOut->disable();
    $user = $this->getUser();
    $id = $user->getId();
    if ($id == 0) {
      echo "{\"error\":\"You are not logged in\"}";
      return;
    }
    if ( !$user->isAllowed("edit") ) {
      echo "{\"error\":\"You do not have edit-permission: please consult an administrator\"}";
      return;
    }

    require(__DIR__ . "/upd_setup.php");
    $request = $this->getRequest();
    echo update_setup(
      $this->mysqli,
      $request->getText("tran_catg"),
      $request->getText("tran_code"),
      $request->getText("tran_text"),
      $request->getText("lang_code")
    );
  }

  function reg_ndcr() {
    global $wgOut;
    $wgOut->disable();
    $user = $this->getUser();
    if ( !$user->isAllowed("createpage") ) {
      return;
    }

    require(__DIR__ . "/reg_ndcr.php");
    $request = $this->getRequest();
    register_ndcr(
      $this->mysqli,
      $request->getText("page_id"),
      $request->getText("user_name"),
      $request->getText("lang_code")
    );
  }

  function db_connect() {
    $mysqli = new mysqli("mariadb-prod", $this->config["DB_USER"], $this->config["DB_PASS"], "vp_translate");
    if ($mysqli->connect_error) {
      die("Connect Error (" . $mysqli->connect_errno . ") " . $mysqli->connect_error);
    }
    return $mysqli;
  }
}
?>
