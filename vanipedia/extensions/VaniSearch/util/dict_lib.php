<?php

$config = require '/var/www/vanipedia/vanipedia.env.php';
$mysqli; 
$petl_id = 3;
$petl_name = 'vanisource'; 
$delims = chr(10).chr(13).'_ ./()"\':,.;<>~!@#$%^&*|+=[]{}\\`—“”‘’?-…';

DbConnect();
// IdentifyPetal();  /* = TEMPORARY !!! */

function process_content ($page_id, $page_text, $restore) {
  global $mysqli;
  // delete existing entries for this page, except in case of a page restore
  if (!$restore) del_old_entries($page_id);

  // generate DICT entries for this page (including DIPA links)
  gen_dict_entries ($page_id, $page_text, 0);

  return 1;
}

function del_old_entries ($page_id) {
  global $mysqli, $petl_id;

  $sql = "delete from vp_search.dipa where petl_id = $petl_id and page_id = $page_id ";
  $mysqli->query($sql);
  $sql = "delete from dict where dict_id in (select dict_id from dict left join dipa using(dict_id) where page_id is null)";
  $mysqli->query($sql);  
}

function goto_state ($chr, $state) {
  switch ($state) {
    case 0:
      if ($chr == "[") $state = 1; else if ($chr == "{") $state = 2; break;
    case 1:
      if ($chr == "[") $state = 3; else $state = 0; break;
    case 2:
      if ($chr == "{") $state = 4; else $state = 0; break;
    case 3:
      if ($chr == "]") $state = 5; break;
    case 4:
      if ($chr == "}") $state = 6; break;
    case 5:
      if ($chr == "]") $state = 0; else $state = 3; break;
    case 6:
      if ($chr == "}") $state = 0; else $state = 4; break;
  }
  return $state;
}

function gen_dict_entries ($page_id, $page_text, $from_c) {
  global $mysqli, $delims, $petl_id;

  $state = 0;
  $dict_text = "";
  $len = mb_strlen($page_text);
  $boundary = 0;
  $cpos = 0; $wpos = 0;

  //determine the last dict identifier
  $sql = "select ifnull(max(dict_id),0) from vp_search.dict order by dict_id";
  $result = $mysqli->query($sql);
  $fields = $result->fetch_array();
  $dict_id = $fields[0];
  $dict_search = 0;

  // loop through the page text
  $itr = 0; /* iterations */

  for ($i = $from_c; $i < $len ; $i += 1) {
    $chr = mb_substr($page_text,$i,1);
    $state = goto_state($chr, $state);
    if (($state == 3) or ($state == 4)) continue;

    if (!char_is_allowed($chr)) $boundary = 1;
    else {
      $boundary = -1;
      if ($dict_text == "") $cpos = $i;
      $dict_text .= $chr;      
    }    

    if ((($boundary == 1) or ($i == $len - 1)) and (trim($dict_text) > '')) {
      process_word($page_id, $cpos, $wpos, $dict_search, $dict_text, $dict_id);
      $wpos += 1;
    } /* end of if-block */  
    $itr += 1;
  } /* end of for-loop */
}

function process_word($page_id, $cpos, $wpos, $dict_search, &$dict_text, &$dict_id) {
  global $mysqli, $petl_id;
  
  $lead  = strspn($dict_text, "'");
  $trail = strspn(strrev($dict_text), "'");
  if ($lead + $trail < strlen($dict_text)) {
    $dict_text = trim($dict_text, "'");
    $cpos += $lead;
  } else {
    $dict_text = ""; return;
  }

  $dict_text = $mysqli->real_escape_string($dict_text);
  $sql = "select dict_id, dict_search from vp_search.dict where dict_text = '$dict_text' ";
  $result = $mysqli->query($sql);
  if ($result->num_rows > 0) {
    $fields = $result->fetch_array();
    $id = $fields[0]; $dict_search = $fields[1];
  } else {
    $id = 0; $dict_search = 1;
  }

  if ($id == 0) {
    $dict_id += 1;
    $dict_search = get_search_flag($dict_text);
    $dict_same = get_same_flag($dict_text, $dict_id);
    $sql =
      "insert into vp_search.dict (dict_id,dict_text,dict_text2,dict_length,dict_freq,dict_search,dict_idQ) ".
      "values ($dict_id, '$dict_text', '$dict_text', char_length(dict_text), 1, $dict_search, $dict_same) ";
    $mysqli->query($sql);
    $id = $dict_id;
  }
  $dict_text = "";

  // create intersection record between page and dict
  if ($dict_search == 1) {
    $sql = 
      "insert into vp_search.dipa (dict_id, page_id, petl_id, dipa_cpos, dipa_wpos) ".
      "values ($id, $page_id, $petl_id, $cpos, $wpos)";
    $mysqli->query($sql);
  }
}

function char_is_allowed($char): bool {
  return preg_match("/[\p{L}\p{N}\-']/u", $char);
}

function get_search_flag ($dict_text) {
  global $mysqli;
  $sql = "select ifnull(max(dict_search),1) from vp_search.dict where dict_text2 = '$dict_text' and dict_search = 0 ";
  $result = $mysqli->query($sql);      
  $fields = $result->fetch_array();
  return $fields[0];
}

function get_same_flag ($dict_text, $dict_id) {
  global $mysqli;
  $sql = "select ifnull(max(dict_idQ),$dict_id) from vp_search.dict where dict_text2 = '$dict_text' ";
  $result = $mysqli->query($sql);      
  $fields = $result->fetch_array();
  return $fields[0];
}

function DbConnect () {
  global $mysqli, $config;

  $host = "mariadb-prod";
  $user = $config['DB_USER'];
  $password = $config['DB_PASS'];
  $database = "vp_search";
  $mysqli = new mysqli($host,$user,$password,$database);
  if ($mysqli->connect_error) {
    die('Connect Error (' . $mysqli->connect_errno . ') '
      . $mysqli->connect_error);
  }
  $mysqli->query("set names utf8");
}

function IdentifyPetal() {
  global $mysqli, $petl_id, $petl_name;

  // get the petal identifier
  $sql = "select petl_id from vp_search.petl where petl_name = '$petl_name'";
  $result = $mysqli->query($sql);
  $fields = $result->fetch_array();
  $petl_id = $fields[0];
}

function GetPageStatus($page_id) {
  global $mysqli, $petl_id;

  // get the page status
  $sql = 
    "select ifnull(max(page_status),-1) from vp_search.page  ".
    "where petl_id = $petl_id and page_id = $page_id";
  $result = $mysqli->query($sql);
  $fields = $result->fetch_array();
  return $fields[0];
}

function SetPageStatus ($page_id, $page_status, $page_time = 0) {
  global $mysqli, $petl_id;

  // if not exists, create page registration, otherwise update status
  $sql = "select 1 from vp_search.page where petl_id = $petl_id and page_id = $page_id";
  $result = $mysqli->query($sql);
  if ($result->num_rows == 0) {
    $sql = "insert into vp_search.page (petl_id, page_id, page_status, page_time) values ($petl_id, $page_id, $page_status, $page_time)";
    $mysqli->query($sql);
  }
  else {
    $sql = 
      "update vp_search.page set page_status = $page_status, page_time = $page_time ".
      "where petl_id = $petl_id and page_id = $page_id ";
    $mysqli->query($sql);
  }
}

function SyncLanguage ($page_id) {
  global $mysqli;

  // set the page language according to the prefix in the title
  $sql = 
    "update vanisource.vanisource_page p ".
    "set p.page_lang = ".
    "  (select l.lang_code from vp_search.lang l ".
    "   where p.page_title like concat(upper(l.lang_code),'/%')) ".
    "where p.page_id = $page_id and p.page_lang is null ";
  $mysqli->query($sql);

  // if the page title has no (known) language prefix, then set the language to English
  $sql = 
    "update vanisource.vanisource_page p ".
    "set p.page_lang = 'en' ".
    "where p.page_id = $page_id and p.page_lang is null ";
  $mysqli->query($sql);

  // take care that newly used languages are selectable
  $sql = 
    "update vp_search.lang l ".
    "set l.lang_show = 1 ".
    "where l.lang_show = 0 ".
    "and l.lang_code = ".
    "  (select p.page_lang from vanisource.vanisource_page p ".
    "   where p.page_id = $page_id) ";
  $mysqli->query($sql);
}

function LogMessage ($message) {
  global $mysqli;

  $sql = "insert into dbug (dbug_text) values ('$message') ";
  $mysqli->query($sql);
}
