<?php

class VaniSearchHooks {

private static $mysqli, $config;

public static function onPageSaveComplete($wikiPage, $user, $summary, $flags, $revisionRecord, $editResult ) {
  if (!in_array($wikiPage->getTitle()->getNamespace(), [0,14])) return;
  $page_id = $wikiPage->getId();
  self::DbConnect();
  self::SyncPageLang($page_id);
  self::SetPageStatus ($page_id, 0);
  return true;
}

public static function onArticleDeleteComplete ($article, $user, $reason, $id, $content, $logEntry) {
  // set the page status to "deleted"
  self::DbConnect();
  self::SetPageStatus ($id, 5);
  return true;
}

public static function onArticleUndelete ($title, $create, $comment, $oldPageId, $restoredPages) {
  // set the page status to "to be processed"
  self::DbConnect();
  self::SetPageStatus ($oldPageId, 0);
  return true;
}

private static function SyncPageLang ($id) {
  // set the page language according to the prefix in the title
  $sql = 
    "update vanisource.vanisource_page p ".
    "set p.page_lang = ".
    "  (select l.lang_code from vp_search.lang l ".
    "   where p.page_title like concat(upper(l.lang_code),'/%')) ".
    "where p.page_id = $id and p.page_lang is null ";
  self::$mysqli->query($sql);

  // if the page title has no (known) language prefix, then set the language to English
  $sql = 
    "update vanisource.vanisource_page p ".
    "set p.page_lang = 'en' ".
    "where p.page_id = $id and p.page_lang is null ";
  self::$mysqli->query($sql);

  // take care that newly used language is selectable
  $sql = 
    "update vp_search.lang l ".
    "set l.lang_show = 1 ".
    "where l.lang_show = 0 ".
    "and l.lang_code = ".
    "  (select p.page_lang from vanisource.vanisource_page p ".
    "   where p.page_id = $id) ";
  self::$mysqli->query($sql);
}

private static function SetPageStatus ($page_id, $page_status, $page_time = 0) {
  $petl_id = 3; /* Vanisource */

  // if not exists, create page registration, otherwise update status
  $sql = "select 1 from vp_search.page where petl_id = $petl_id and page_id = $page_id";
  $result = self::$mysqli->query($sql);
  if ($result->num_rows == 0) {
    $sql = "insert into vp_search.page (petl_id, page_id, page_status, page_time) values ($petl_id, $page_id, $page_status, $page_time)";
    self::$mysqli->query($sql);
  }
  else {
    $sql = 
      "update vp_search.page set page_status = $page_status, page_time = $page_time ".
      "where petl_id = $petl_id and page_id = $page_id ";
    self::$mysqli->query($sql);
  }
}

private static function DbConnect () {
  if (self::$mysqli) return;
  if (!self::$config) self::$config = require '/var/www/vanisource/vanisource.env.php';
            
  self::$mysqli = new mysqli("localhost",self::$config['DB_USER'],self::$config['DB_PASS'],"vp_search");
  if (self::$mysqli->connect_error) {
    die('Connect Error ('.self::$mysqli->connect_errno.') '.self::$mysqli->connect_error);
  }
  self::$mysqli->query("set names utf8");
}

private static function LogMessage ($message) {
  $sql = "insert into dbug (dbug_text) values ('$message') ";
  self::$mysqli->query($sql);
}

}
