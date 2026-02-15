<?php
include ("inc/db_connect.php");

$func = @$_GET['func'];
if ($func == "getTRPRmaster") {
  $prop_id = @$_GET['prop_id'];
  $result = getTRPRmaster($prop_id);
} if ($func == "getTRPRdetail") {
  $tran_id = @$_GET['tran_id'];
  $result = getTRPRdetail($tran_id);
} else if ($func == "getTRANmaster") {
  $filt = @$_GET['filt'];
  $result = getTRANmaster($filt);
} else if ($func == "setTRPR") {
  $tran_id = @$_POST['tran_id'];
  $prop_id = @$_POST['prop_id'];
  $trpr_seq = @$_POST['trpr_seq'];
  $from = @$_POST['from'];
  $until = @$_POST['until'];
  $result = setTRPR($tran_id,$prop_id,$trpr_seq,$from,$until);
} else if ($func == "getProperties") {
  $result = getProperties();
} else if ($func == "addProperty") {
  $tran_id = @$_GET['tran_id'];
  $prop_id = @$_GET['prop_id'];
  $result = addProperty($tran_id,$prop_id);
} else if ($func == "delProperties") {
  $tran_id = @$_GET['tran_id'];
  $list_seq = @$_GET['list_seq'];
  $result = delProperties($tran_id,$list_seq);
}

echo $result;

function getTRPRmaster($prop_id) {
  global $mysqli;

  $translations = []; 
  $sql = 
    "select concat(trpr.tran_id,concat('_',concat(trpr.prop_id,concat('_',trpr_seq)))) trpr_id, ".
    "tran_text, vers_ref, trpr_seq, trpr_from, trpr_until from tran inner join trpr using(tran_id) ". 
    "inner join vers using(vers_id) where prop_id = $prop_id order by vers_ref"; 
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($translations, [
      "trpr_id"=>$fields[0], 
      "tran_text"=>$fields[1], 
      "vers_ref"=>$fields[2], 
      "trpr_seq"=>$fields[3], 
      "trpr_from"=>$fields[4], 
      "trpr_until"=>$fields[5], 
      "trpr_select"=>false
    ]);
  }
  return json_encode($translations,JSON_NUMERIC_CHECK);
}

function getTRPRdetail($tran_id) {
  global $mysqli;

  $properties = []; 
  $sql = 
    "select concat(trpr.tran_id,concat('_',concat(trpr.prop_id,concat('_',trpr_seq)))) trpr_id, ".
    "trpr_seq, prop_desc from prop inner join trpr using(prop_id) ". 
    "where tran_id = $tran_id order by trpr_seq"; 
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($properties, [
      "trpr_id"=>$fields[0], 
      "trpr_seq"=>$fields[1], 
      "prop_desc"=>$fields[2], 
      "trpr_select"=>false
    ]);
  }
  return json_encode($properties,JSON_NUMERIC_CHECK);
}

function getTRANmaster($filt) {
  global $mysqli;

  $tran = [];
  $filt = strtolower($mysqli->real_escape_string($filt));
  $pc = "(select count(*) from trpr where trpr.tran_id = tran.tran_id) PC";
  $sql = 
    "select tran_id, tran_text, vers_ref, $pc from tran ". 
    "inner join vers using(vers_id) where vani_id = 5 ".
    "and tran_text like '%$filt%' order by vers_ref"; 
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($tran, [
      "tran_id"=>$fields[0], 
      "tran_text"=>$fields[1], 
      "vers_ref"=>$fields[2], 
      "prop_count"=>$fields[3], 
      "tran_select"=>false
    ]);
  }
  return json_encode($tran,JSON_NUMERIC_CHECK);
}

function setTRPR($tran_id,$prop_id,$trpr_seq,$from,$until) {
  global $mysqli;

  $sql = 
    "update trpr set trpr_from = $from, trpr_until = $until ".
    "where tran_id = $tran_id and prop_id = $prop_id and trpr_seq = $trpr_seq";
  $mysqli->query($sql);
  return true;
}

function getProperties() {
  global $mysqli;

  $properties = []; 
  $sql = "select prop_id, prop_desc from prop order by prop_id";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    $properties[$fields[0]] = $fields[1];
  }
  return json_encode($properties,JSON_NUMERIC_CHECK);
}

function addProperty($tran_id,$prop_id) {
  global $mysqli;
  
  $sql = "insert into trpr(tran_id,prop_id) values($tran_id, $prop_id)";
  $mysqli->query($sql);
  
  return true;
}

function delProperties($tran_id,$list_seq) {
  global $mysqli;
  
  $sql = "delete from trpr where tran_id = $tran_id and trpr_seq in $list_seq";
  $mysqli->query($sql);
  $sql = "call reseq_trpr($tran_id)";
  $mysqli->query($sql);
  return true;
}

?>