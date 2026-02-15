<?php
include ("inc/db_connect.inc");

$func = @$_GET["func"];
if ($func == "getUsers") {
  $return = getUsers();
} else if ($func == "getLanguages") {
  $return = getLanguages();
} else if ($func == "getStatistics") {
  $str_date_from = @$_POST["date_from"];
  $str_date_until = @$_POST["date_until"];
  $time_unit = @$_POST["time_unit"];
  $user_id = @$_POST["user_id"];
  $lang_id = @$_POST["lang_id"];
  $horiz = @$_POST["horiz"];
  $vertic = @$_POST["vertic"];
  $return = getStatistics($str_date_from,$str_date_until,$time_unit,$user_id,$lang_id,$horiz,$vertic);
}
echo $return;

function getUsers() {
  global $mysqli;
  
  $sql = "select distinct user_id, user_name from vp_translate.ndcr inner join vanipedia.vanipedia_user using (user_id)";
  $result = $mysqli->query($sql);
  $obj = [];
  while ($fields = $result->fetch_row()) {
    $obj[$fields[0]] = $fields[1];
  }
  return json_encode($obj);
}

function getLanguages() {
  global $mysqli;
  
  $sql = "select distinct lang_id, lang_english from vp_translate.ndcr inner join vp_search.lang using (lang_id)";
  $result = $mysqli->query($sql);
  $obj = [];
  while ($fields = $result->fetch_row()) {
    $obj[$fields[0]] = $fields[1];
  }
  return json_encode($obj);
}

function getStatistics($str_date_from,$str_date_until,$time_unit,$user_id,$lang_id,$horiz,$vertic) {
  global $mysqli;
  
  $sql_time["Y"] = "year(ndcr_time)";
  $sql_time["M"] = "concat(year(ndcr_time), '-', substring(monthname(ndcr_time),1,3))";
  $sql_time["W"] = "concat(year(ndcr_time), '-W', lpad(week(ndcr_time,3),2,0))";
  $sql_field["U"] = "user_name";
  $sql_field["L"] = "lang_english";
  $sql_field["T"] = $sql_time[$time_unit];
  $sql_field["Q"] = "'total'";

  $where = genWhere($str_date_from,$str_date_until,$user_id,$lang_id);
  $lab_horiz = getLabels($sql_field[$horiz],$where);
  $sql = genDataQuery($sql_field[$horiz],$sql_field[$vertic],$lab_horiz,$where);
  $result = $mysqli->query($sql);
  $lab_vertic = []; $matrix = [];
  while ($fields = $result->fetch_row()) {
    array_push($lab_vertic,$fields[0]);
    array_push($matrix,array_slice($fields,1));
  }

  return json_encode(["horiz"=>$lab_horiz, "vertic"=>$lab_vertic, "matrix"=>$matrix],JSON_NUMERIC_CHECK);
}

function genDataQuery($h_field,$v_field,$lab_horiz,$where) {
  $count_expr = "";
  foreach ($lab_horiz as $lab) $count_expr .= ", count(if($h_field = '$lab',1,null)) ";
  $sql = 
    "select $v_field".$count_expr." from vp_translate.ndcr ".
    "inner join vanipedia.vanipedia_user using (user_id) ".
    "inner join vp_search.lang using (lang_id) ".
    "$where and ndcr_deleted = 0 group by 1";
  return $sql;
}

function genWhere($from,$until,$user_id,$lang_id) {
  $where =
    "where date(ndcr_time) between '$from' and '$until' ".
    ($user_id == 0 ? "" : "and user_id = $user_id ").
    ($lang_id == 0 ? "" : "and lang_id = $lang_id ").
    "and ndcr_deleted = 0";
  return $where;
}

function getLabels($field,$where) {
  global $mysqli;

  $labels = [];  
  $sql = 
    "select $field from vp_translate.ndcr ".
    "inner join vanipedia.vanipedia_user using (user_id) ".
    "inner join vp_search.lang using (lang_id) ".
    "$where and ndcr_deleted = 0 group by 1";

  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($labels,$fields[0]);
  }
  return $labels;
}

?>
