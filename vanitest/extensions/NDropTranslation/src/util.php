<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include ("inc/db_connect.inc");

$params = [];
$types = '';

$func = @$_GET["func"];
if ($func == "listYearLoca") {
  $type = @$_GET["type"];
  $return = listYearLoca($type);
} else if ($func == "listLanguages") {
  $return = listLanguages();
} else if ($func == "listNDrops") {
  $year = @$_GET['year'];
  $loca = @$_GET['loca'];
  $lang_code = @$_GET['lang_code'];
  $lang_name = @$_GET['lang_name'];
  $return = listNDrops($year, $loca, $lang_code, $lang_name);
} else if ($func == "getNdropData") {
  $page_id = @$_GET['page_id'];
  $lang_code = @$_GET['lang_code'];
  $lang_name = @$_GET['lang_name'];
  $return = getNdropData($page_id,$lang_code,$lang_name);
}  else if ($func == "getSetupData") {
  $lang_code = @$_GET['lang_code'];
  $return = getSetupData($lang_code);
}
echo $return;

function listYearLoca($type) {
  global $mysqli;
  
  $sql = 
    "select * from ".
    " (select cat_title, trim(substring(replace(page_title,'_',' '), locate('-', page_title) + 1)) year_place ".
    "  from vanipedia.vanipedia_categorylinks ".
    "  inner join vanipedia.vanipedia_page on page_id = cl_from ".
    "  inner join vanipedia.vanipedia_category on cat_title = page_title ".
    "  where cl_to = 'Nectar_Drops_from_Srila_Prabhupada' ".
    "  and cl_type = 'subcat' ".
    "  and page_title like 'Nectar_Drops%') q ".
    "where year_place ".($type == "loca" ? "not " : "")."like '19%' ";
  
  $result = $mysqli->query($sql);
  $obj = [];
  while ($fields = $result->fetch_row()) {
    $obj[$fields[0]] = $fields[1];
  }
  return json_encode($obj);
}

function listLanguages() {
  global $mysqli;
  
  $sql = 
    "select lang_code, convert(cast(lang_english as binary) using latin1) ". 
    "from vp_search.lang where lang_show = 1 and lang_code <> 'en' order by lang_english";
  $result = $mysqli->query($sql);
  $obj = [];
  while ($fields = $result->fetch_row()) {
    $obj[$fields[0]] = $fields[1];
  }
  return json_encode($obj);
}

function listNDrops($year, $loca, $lang_code, $lang_name) {
  global $mysqli, $params, $types;

  $html = "";
  $ndsp = ($lang_code ? getTransNdsp ($lang_code, $lang_name) : "");
  $sql = sqlNDrops($year, $loca, $lang_code, $ndsp); 
  
  $stmt = $mysqli->prepare($sql);
  if ($types) $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $titles = [];
  while ($fields = $result->fetch_row()) {
    $page_id = $fields[0];
    $page_title = str_replace("_", " ", $fields[1]);
    array_push($titles, ["id"=>$page_id, "title"=>$page_title]);
  }
  return json_encode(["total"=>$result->num_rows, "titles"=>$titles],JSON_NUMERIC_CHECK);
}

function sqlNDrops ($year, $loca, $lang_code, $ndsp) {
  global $params, $types;
  
  $params = []; $types = ''; $sql; $sql_y; $sql_l;
  
  $extra = ($lang_code ? ", concat(substring(page_title, 1, locate('_', page_title) - 1),'\_') prefix " : " ");
  if (!$year && !$loca) {
    $sql = 
      "select page_id, page_title".$extra.
      "from vanipedia.vanipedia_categorylinks ".
      "inner join vanipedia.vanipedia_page on page_id = cl_from ".
      "where cl_to = 'Nectar_Drops_from_Srila_Prabhupada' and cl_type = 'page' ";
  }
  if ($year) {
    $sql_y = 
      "select page_id, page_title".$extra."from vanipedia.vanipedia_categorylinks ".
      "inner join vanipedia.vanipedia_page on page_id = cl_from ".
      "where cl_to = ? and cl_type = 'page' ";
    $params[] = $year; $types .= 's';
  }
  if ($loca) {
    if ($year) $extra = " ";
    $sql_l = 
      "select page_id, page_title".$extra."from vanipedia.vanipedia_categorylinks ".
      "inner join vanipedia.vanipedia_page on page_id = cl_from ".
      "where cl_to = ? and cl_type = 'page' ";
    $params[] = $loca; $types .= 's';
  }
  if ($year && $loca) {
    $sql = $sql_y." and (page_id, page_title) in (".$sql_l.")";
  } else {
    if ($year) $sql = $sql_y;
    if ($loca) $sql = $sql_l;
  }
  if ($ndsp) {
    $sql = 
      "select page_id, page_title from ($sql) q ".
      "where not exists ".
      "(select 1 from vanipedia.vanipedia_page ".
      " inner join vanipedia.vanipedia_categorylinks on cl_from = page_id ".
      " where page_namespace = 0 ".
      " and page_title like concat(?,'/',q.prefix,'%') ".
      " and cl_to = '".$ndsp."') ";
    $params[] = $lang_code; $types .= 's';  
  }

  return $sql;
}

function getTransNdsp ($lang_code, $lang_name) {
  global $mysqli;

  $like = strtoupper($lang_code)."/$lang_name%";
  $sql =
    "select ifnull(max(page_title),'NDSP') from vanipedia.vanipedia_categorylinks ".
    "inner join vanipedia.vanipedia_page on page_id = cl_from ".
    "where cl_to = 'Participating_Languages_-_Nectar_Drops_from_Srila_Prabhupada' ".
    "and page_title like ?";

  $params = [$like]; $types = 's';
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();

  $fields = $result->fetch_row();
  return $fields[0];
}

function getNdropData($page_id,$lang_code,$lang_name) {
  $result = getPageResult($page_id);
  $fields = $result->fetch_row();
  $english = parseNdrop($page_id,$fields[0],$fields[1]);
  $translation = getTransData($page_id,$lang_code,$lang_name,$english);
  return json_encode(["english"=>$english, "translation"=>$translation],JSON_NUMERIC_CHECK);
}

function getPageResult($page_id) {
  global $mysqli;
  
  $sql =
    "select page_title, old_text from vanipedia.vanipedia_page ".
    "inner join vanipedia.vanipedia_slots on slot_revision_id = page_latest ".
    "inner join vanipedia.vanipedia_content on content_id = slot_content_id ".
    "inner join vanipedia.vanipedia_text on old_id = substr(content_address,4) ".
    "where page_id = ?";

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('i', $page_id);
  $stmt->execute();
  $result = $stmt->get_result();
  
  return $result;
}

function parseNdrop($id,$title,$text) {
  $title = str_replace("_"," ",$title);
  $text = stripNavBar($text);
  $arr = explode("|",$text);
  $categories = catgFromText($arr[0]);
  $audio_url = $arr[2];
  $ndrop_text = composeText($arr);
  $len = count($arr);
  $source_href = $arr[$len - 2]; 
  $source_text = explode("}}",$arr[$len - 1])[0];
  $references = [$source_href,$source_text];
  
  return [
    "id"=>$id, 
    "title"=>$title, 
    "page_text"=>$text, 
    "ndrop_text"=>$ndrop_text, 
    "audio_url"=>$audio_url, 
    "categories"=>$categories, 
    "references"=>$references];
}

function getTransData($page_id,$lang_code,$lang_name,$english) {
  $prefix = explode(" ",$english["title"])[0];
  $id = findNdropTrans($prefix,$lang_code,$lang_name);
  if ($id) {
    $result = getPageResult($id);
    $fields = $result->fetch_row();
    return parseNdrop($id,$fields[0],$fields[1]);
  } else {
    $title = str_replace("_"," ",getTransTitle($lang_code,$page_id));
    $text = ""; 
    $ndrop_text = $english["ndrop_text"];
    $audio_url = "";
    $categories = catgFromOrig($lang_code,$lang_name,$english["categories"]);
    $references = srefFromOrig($lang_code,$english["references"]);
    return [
      "id"=>$id, 
      "title"=>$title, 
      "page_text"=>$text, 
      "ndrop_text"=>$ndrop_text, 
      "audio_url"=>$audio_url, 
      "categories"=>$categories, 
      "references"=>$references];
  }
}

function getTransTitle ($lang_code,$page_id) {
  global $mysqli;
  
  $sql = "select vp_translate.nectar_drop(?,?) from dual";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('si',$lang_code,$page_id);
  $stmt->execute();
  $result = $stmt->get_result();

  $fields = $result->fetch_row();
  return $fields[0];
}

function catgFromText($text) {
  $categories = [];
  $text = explode("{{",$text)[0];
  $arr = explode("[[Category:",$text);
  for ($i = 1; $i < count($arr); $i++) {
    $catg = trim(str_replace("]]","",$arr[$i]));
    array_push($categories, $catg);
  }
  return $categories;
}

function catgFromOrig($lang_code,$lang_name,$arr_catg) {
  $categories = [];
  for ($i = 0; $i < count($arr_catg); $i++) {
    $catg = getCatgTrans($lang_code,$arr_catg[$i]);
    $catg = (($i == 0) ? strtoupper($lang_code)."/".$lang_name." - " : strtoupper($lang_code)."/").$catg;
    array_push($categories,$catg);
  }
  return $categories;
}

function srefFromOrig($lang_code,$arr_sref) {
  $source_href = $arr_sref[0];
  $source_text = getSrefTrans($lang_code,$arr_sref[1]);
  return [$source_href,$source_text];
}

function getSrefTrans($lang_code,$text) {
  global $mysqli;
  
  $arr = explode(" - ",$text);
  $size = count($arr);
  $date = trim($arr[0]);
  $event = trim(implode(" - ",array_slice($arr, 1, $size - 2)));
  $loca = trim($arr[$size - 1]);

  $sql =
    "select length(o.tran_code), t.tran_text from vp_translate.tran o ".
    "inner join vp_translate.tran t on t.tran_lang = ? and t.tran_code = o.tran_code ".
    "where o.tran_catg = 1 and o.tran_lang = 'en' ".
    "and '$event' like concat(o.tran_code,'%') ";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $lang_code);
  $stmt->execute();
  $result = $stmt->get_result();
  
  if ($result->num_rows == 0) $event_trans = $event;
  else {
    $fields = $result->fetch_row();
    $length = $fields[0];
    $type = $fields[1];
    $event_trans = $type.substr($event,$length);
  }
  $trans = getTranText(0,$lang_code, $loca);
  $loca_trans = ($trans ? $trans : $loca);
  $sref_trans = $date." - ".$event_trans." - ".$loca_trans;

  return $sref_trans;
}


function getCatgTrans($lang_code,$catg_orig) {
  $arr = explode("-",$catg_orig);
  $catg_trans = "";
  for ($i = 0; $i < count($arr); $i++) {
    $text = trim($arr[$i]);
    if ($i == 0) {
      $tran_code = getTranCode($text);
      if (!$tran_code) $catg_trans .= $text;
      else {
        $trans = getTranText(0,$lang_code, $tran_code);
        $catg_trans .= ($trans ? $trans : $text);
      }
    } else {
      // here we should either have a year or a location,
      // since the NDSP category does not contain a hyphen
      $trans = getTranText(0,$lang_code,$text);
      $catg_trans .= " - ".($trans ? $trans : $text);
    }
  }
  return $catg_trans;
}

function findNdropTrans ($prefix,$lang_code,$lang_name) {
  global $mysqli;

  $prefix = $prefix."\_";
  $ndsp = getTransNdsp($lang_code, $lang_name);
  $like = strtoupper($lang_code)."/$prefix%";
  $sql = 
    "select ifnull(max(page_id),0) from vanipedia.vanipedia_page ".
    "inner join vanipedia.vanipedia_categorylinks on cl_from = page_id ".
    "where page_namespace = 0 and page_title like ? and cl_to = '$ndsp'";

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s',$like);
  $stmt->execute();
  $result = $stmt->get_result();

  $fields = $result->fetch_row();
  return $fields[0];
}

function composeText ($arr) {
  $text = "";
  for ($i = 3; $i < count($arr)-2; $i++) $text .= "|".$arr[$i];
  return substr($text,1);
}

function stripNavBar($text) {
  $pos1 = strpos($text,"<!-- BEGIN NAVIGATION");
  if ($pos1 === false) return $text;
  $pos2 = strpos($text,"<!-- END NAVIGATION"); 
  $pos3 = strpos($text,"-->",$pos2); 
  return trim(substr($text,0,$pos1)).substr($text,$pos3 + 3);
}

function getTranCode($text) {
  global $mysqli;
  $sql =
    "select tran_code from vp_translate.tran ".
    "where tran_lang = 'en' and tran_text= '$text'";
  $result = $mysqli->query($sql);
  if ($result->num_rows == 0) return "";
  else {
    $fields = $result->fetch_row();
    return $fields[0];
  }
}

function getTranText($idx,$lang,$code) {
  global $mysqli;
  $sql =
    "select tran_text from vp_translate.tran ".
    "where tran_lang = ? and tran_code = ?";

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('ss',$lang,$code);
  $stmt->execute();
  $result = $stmt->get_result();

  if ($result->num_rows == 0) return "";
  else {
    $fields = $result->fetch_row();
    return explode("/",$fields[0])[$idx];
  }
}

function getSetupData($lang_code) {
  global $mysqli;

  $sql =
    "select o.tran_catg, o.tran_code, ifnull(t.tran_id,0), ifnull(t.tran_text,o.tran_text), o.tran_text from vp_translate.tran o ".
    "left join vp_translate.tran t on o.tran_code = t.tran_code and t.tran_lang = ? ".
    "where o.tran_lang = 'en' order by o.tran_code";

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s',$lang_code);
  $stmt->execute();
  $result = $stmt->get_result();

  $data = [];
  while ($fields = $result->fetch_row()) {
    $catg = $fields[0]; $code = $fields[1]; $idT = $fields[2]; $text = $fields[3]; $english = $fields[4];
    array_push($data, ["catg"=>$catg, "code"=>$code, "idT"=>$idT, "text"=>$text, "english"=>$english]);
  }
  return json_encode($data,JSON_NUMERIC_CHECK);
}

?>