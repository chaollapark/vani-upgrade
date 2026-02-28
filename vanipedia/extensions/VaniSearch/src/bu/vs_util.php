<?php
include("inc/db_connect.inc");

$func = @$_GET['func'];
if ($func == "get_languages") {
  $result = get_languages();
} else if ($func == "get_books") {
  $result = get_books();
} else if ($func == "get_parts") {
  $result = get_parts();
} else if ($func == "get_chaps") {
  $result = get_chaps();
} else if ($func == "get_vanitypes") {
  $result = get_vanitypes();
} else if ($func == "get_vanis") {
  $result = get_vanis();
} else if ($func == "match_text") {
  $str = @$_GET['str'];
  $ds = @$_GET['ds'];
  $result = get_matches_text($str, $ds);
} else if ($func == "match_catg") {
  $str = @$_GET['str'];
  $lang = @$_GET['lang'];
  $vp = @$_GET['vp'];
  $vq = @$_GET['vq'];
  $vs = @$_GET['vs'];
  $vm = @$_GET['vm'];
  $result = get_matches_titl($str, 14, $lang, $vp, $vq, $vs, $vm);
} else if ($func == "match_page") {
  $str = @$_GET['str'];
  $lang = @$_GET['lang'];
  $vp = @$_GET['vp'];
  $vq = @$_GET['vq'];
  $vs = @$_GET['vs'];
  $vm = @$_GET['vm'];
  $result = get_matches_titl($str, 0, $lang, $vp, $vq, $vs, $vm);
} else if ($func == "get_feedbacks") {
  $result = get_feedbacks();
} else if ($func == "get_fdbk_text") {
  $fdbk_id = @$_GET['fdbk_id'];
  $result = get_fdbk_text($fdbk_id);
} else if ($func == "get_countries") {
  $result = get_countries();
} else if ($func == "insert_fdbk") {
  $params = json_decode(@$_POST['params']);
  $result = insert_fdbk($params);
}

echo $result;

function get_languages() {
  global $mysqli;

  $languages = [];
  $sql = "select lang_code, lang_english from lang where lang_show = 1 order by lang_english";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $code = $values[0]; $name = $values[1];
    $languages[$code] = ["name" => $name];
  }
  return json_encode($languages);
}

function get_books() {
  global $mysqli;

  $books = [];
  $sql = "select book_id, book_name from book order by book_name";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $name = $values[1];
    $books[$id] = ["name" => $name];
  }
  return json_encode($books);
}

function get_parts() {
  global $mysqli;

  $parts = [];
  $sql = "select part_id, book_id, part_ref from part order by part_id";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; 
    $parts[$id] = ["book_id" => $values[1], "name" => $values[2]];
  }
  return json_encode($parts);
}

function get_chaps() {
  global $mysqli;

  $chaps = [];
  $sql = "select chap_id, book_id, part_id, chap_ref from chap order by chap_id";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; 
    $chaps[$id] = ["book_id" => $values[1], "part_id" => $values[2], "name" => $values[3]];
  }
  return json_encode($chaps);
}

function get_vanitypes() {
  global $mysqli;

  $vanitypes = [];
  $sql = "select vtyp_id, vtyp_name, catg_id from vtyp";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $name = $values[1]; $catg_id = $values[2];
    $vanitypes[$id] = ["name" => $name, "catg_id" => $catg_id];
  }
  return json_encode($vanitypes);
}

function get_vanis() {
  global $mysqli;

  $vanis = [];
  $sql = "select vani_id, vtyp_id, vani_code, vani_name from vani";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $vtyp_id = $values[1]; $code = $values[2]; $name = $values[3];
    $vanis[$id] = ["vtyp_id" => $vtyp_id, "code" => $code, "name" => $name];
  }
  return json_encode($vanis);
}

function get_matches_text($str, $ds) {
  global $mysqli;
  $json = "";
  //$fld = ($ds ? "dict_text" : "dict_text2");
  $fld = "dict_text2";
  $sql =
    "select * from ".
    "(select 1, $fld, sum(dict_freq) freq from dict ".
    " where $fld like '$str%' ".
    " group by $fld order by $fld) q ".
    "order by freq desc ".
    "limit 20";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    $json .= ($json ? ",": "")."[$fields[0],".'"'."$fields[1]".'"'."]";
  }
  return "[$json]";
}

function get_matches_titl($str, $nspace, $lang, $vp, $vq, $vs, $vm) {
  global $mysqli; $arr = []; $json = "";

  if ($vp) array_push($arr, 1);
  if ($vq) array_push($arr, 2);
  if ($vs) array_push($arr, 3);
  if ($vm) array_push($arr, 4);
  $petl_ids = (count($arr) ? implode(",", $arr) : "0");
  $and_lang = ($lang == "0" ? "": " and lang_code = '$lang'");
  $sql =
    "select * from ".
    "(select 1, tokn_text, sum(tkpt_freq) freq from tokn ".
    " inner join tkpt using(tokn_id) ".
    " inner join lang using(lang_id) ".
    " where tokn_text collate utf8mb4_unicode_ci like '$str%' ".
    "   and petl_id in ($petl_ids) ".
    "   and tkpt_nspace = $nspace $and_lang ".
    " group by tokn_text) q ".
    "order by freq desc ".
    "limit 20";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    $json .= ($json ? ",": "")."[$fields[0],".'"'."$fields[1]".'"'."]";
  }
  return "[$json]";
}

function get_feedbacks() {
  global $mysqli;

  $feedbacks = [];
  $sql = 
    "select fdbk_id, fdbk_time, fdbk_name, cntr_name, fdbk_favorite, fdbk_rating ".
    "from fdbk left join vp_servants.cntr using(cntr_id) ";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $time = $values[1]; $name = $values[2]; 
    $country = $values[3]; $favorite = $values[4]; $rating = $values[5]; 
    $feedbacks[$id] = [
      "time" => $time, 
      "name" => $name, 
      "country" => $country, 
      "favorite" => $favorite, 
      "rating" => $rating
    ];
  }
  return json_encode($feedbacks);
}

function get_fdbk_text($fdbk_id) {
  global $mysqli;

  $sql = "select fdbk_text from fdbk where fdbk_id = $fdbk_id ";
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  return $values[0];
}

function get_countries() {
  global $mysqli;

  $countries = [];
  $sql = 
    "select cntr_id, cntr_name from vp_servants.cntr order by cntr_name";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $name = $values[1];
    $countries[$id] = ["name" => $name];
  }
  return json_encode($countries);
}

function insert_fdbk($params) {
  global $mysqli;
  
  
  $sql = "select current_timestamp()";
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  $date = explode(" ", $values[0])[0];

  $ip = $_SERVER["REMOTE_ADDR"];
  $sql = "select count(*) from fdbk where fdbk_ip = '$ip' and fdbk_time like '$date%'";
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();

  if ($values[0] >= 3) {
    return json_encode([
      "message" => "You are not allowed to provide more than 3 feedbacks per day"
    ]);
  }

  $cntr_id = $params->cntr_id;
  $name = $mysqli->real_escape_string($params->name); 
  $email = $mysqli->real_escape_string($params->email);
  $rating = $params->rating;
  $favorite = $mysqli->real_escape_string($params->favorite);
  $text = preg_replace("/\s+/", ' ', preg_replace("/[\r\n]+/", "\n", $params->text));
  $text = $mysqli->real_escape_string($text);
  
  $sql = 
    "insert into fdbk (cntr_id, fdbk_name, fdbk_email, fdbk_rating, fdbk_favorite, fdbk_text, fdbk_ip) ".
    "values ($cntr_id, '$name', '$email', $rating, '$favorite', '$text', '$ip')";
  $result = $mysqli->query($sql);

  return json_encode(["status" => "ok"]);
}
?>