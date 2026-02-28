<?php

class VaniSearchHooks {

private static $mysqli, $config;

public static function onPageSaveComplete($wikiPage, $user, $summary, $flags, $revisionRecord, $editResult ) {
  if (!in_array($wikiPage->getTitle()->getNamespace(), [0,14])) return;
  self::DbConnect();
  self::SyncPageLang($wikiPage->getId());
  /* todo: set page status to 0 */
  return true;
}

private static function SyncPageLang ($id) {
  // set the page language according to the prefix in the title
  $sql = 
    "update vanipedia.vanipedia_page p ".
    "set p.page_lang = ".
    "  (select l.lang_code from vp_search.lang l ".
    "   where p.page_title like concat(upper(l.lang_code),'/%')) ".
    "where p.page_id = $id and p.page_lang is null ";
  self::$mysqli->query($sql);

  // if the page title has no (known) language prefix, then set the language to English
  $sql = 
    "update vanipedia.vanipedia_page p ".
    "set p.page_lang = 'en' ".
    "where p.page_id = $id and p.page_lang is null ";
  self::$mysqli->query($sql);

  // take care that newly used language is selectable
  $sql = 
    "update vp_search.lang l ".
    "set l.lang_show = 1 ".
    "where l.lang_show = 0 ".
    "and l.lang_code = ".
    "  (select p.page_lang from vanipedia.vanipedia_page p ".
    "   where p.page_id = $id) ";
  self::$mysqli->query($sql);
}

private static function DbConnect () {
  if (self::$mysqli) return;
  if (!self::$config) self::$config = require '/var/www/vanipedia/vanipedia.env.php';
            
  self::$mysqli = new mysqli("mariadb-prod",self::$config['DB_USER'],self::$config['DB_PASS'],"vp_search");
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
