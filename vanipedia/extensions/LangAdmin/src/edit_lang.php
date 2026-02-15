<?php
include ("inc/db_connect.inc");

$func = @$_GET["func"];
$id = @$_GET["id"];
$code = @$_GET["code"];
$name = @$_GET["name"];
$english = @$_GET["english"];
$show = @$_GET["show"];
if ($func == "cre_lang") $result = cre_lang($code,$name,$english);
if ($func == "upd_lang") $result = upd_lang($id,$code,$name,$english);
if ($func == "del_lang") $result = del_lang($id);
if ($func == "show_lang") $result = show_lang($id,$show);
echo $result;

function cre_lang($code,$name,$english) {
  global $mysqli;

  $id = $mysqli->real_escape_string($id);
  $code = $mysqli->real_escape_string($code);
  $name = $mysqli->real_escape_string($name);
  $english = $mysqli->real_escape_string($english);

  if (lang_exists(0,"code",$code)) 
    return json_encode(["error" => "This code already exists"]);
  if (lang_exists(0,"name",$name)) 
    return json_encode(["error" => "This name already exists"]);
  if (lang_exists(0,"english",$english))
    return json_encode(["error" => "This English name already exists"]);

  $sql = 
    "insert into lang (lang_code,lang_name,lang_english) values ".
    "('$code', '$name', '$english')";
  $mysqli->query($sql);
  $sql = "select ifnull(max(lang_id),0) from lang";
  $values = $mysqli->query($sql)->fetch_row();
  $id = $values[0];
  return json_encode(["id" => $id, "error" => ""],JSON_NUMERIC_CHECK);
}

function upd_lang($id,$code,$name,$english) {
  global $mysqli;
  
  $id = $mysqli->real_escape_string($id);
  $code = $mysqli->real_escape_string($code);
  $name = $mysqli->real_escape_string($name);
  $english = $mysqli->real_escape_string($english);
  
  if (lang_exists($id,"code",$code)) 
    return json_encode(["error" => "This code already exists"]);
  if (lang_exists($id,"name",$name)) 
    return json_encode(["error" => "This name already exists"]);
  if (lang_exists($id,"english",$english))
    return json_encode(["error" => "This English name already exists"]);

  $sql = 
    "update lang set ".
    "lang_code = '$code', lang_name = '$name', lang_english = '$english' ".
    "where lang_id = $id";
  $mysqli->query($sql);
  return json_encode(["id" => $id, "error" => ""],JSON_NUMERIC_CHECK);
}

function del_lang($id) {
  global $mysqli;

  $id = $mysqli->real_escape_string($id);
  $sql = "delete from lang where lang_id = $id ";
  $mysqli->query($sql);
  return json_encode(["error" => ""]);
}

function show_lang($id,$show) {
  global $mysqli;

  $id = $mysqli->real_escape_string($id);
  $show = $mysqli->real_escape_string($show);
  $sql = "update lang set lang_show = $show where lang_id = $id ";
  $mysqli->query($sql);
  return json_encode(["error" => ""]);
}

function lang_exists ($id,$field,$value) {
  global $mysqli;

  $sql = "select ifnull(max(lang_id),$id) from lang where lang_$field = '$value'";
  $values = $mysqli->query($sql)->fetch_row();
  return ($values[0] != $id);
}

?>