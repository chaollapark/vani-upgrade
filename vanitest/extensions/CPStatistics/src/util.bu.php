<?php
include ("inc/db_connect.inc");

$petals = [];

$func = @$_GET["func"];
if ($func == "getStatistics") {
  $petal = @$_POST["petal"];
  $nspace = @$_POST["nspace"];
  $horiz = @$_POST["horiz"];
  $vertic = @$_POST["vertic"];
  $str_date_from = @$_POST["date_from"];
  $str_date_until = @$_POST["date_until"];
  $time_unit = @$_POST["time_unit"];
  $return = getStatistics($petal,$nspace,$horiz,$vertic,$str_date_from,$str_date_until,$time_unit);
}
echo $return;

function getStatistics($petal,$nspace,$horiz,$vertic,$str_date_from,$str_date_until,$time_unit) {
  global $mysqli;

  genPetals($petal);
  $lab_horiz = getLabels($nspace,$horiz,$vertic,$str_date_from,$str_date_until,$time_unit); 
  $sql = genDataQuery($lab_horiz,$nspace,$horiz,$vertic,$str_date_from,$str_date_until,$time_unit);
  $result = $mysqli->query($sql);
  $lab_vertic = []; $matrix = [];
  while ($fields = $result->fetch_row()) {
    array_push($lab_vertic,$fields[0]);
    array_push($matrix,array_slice($fields,1));
  }
  return json_encode(["horiz"=>$lab_horiz, "vertic"=>$lab_vertic, "matrix"=>$matrix],JSON_NUMERIC_CHECK);
}

function genDataQuery($lab_horiz,$nspace,$horiz,$vertic,$str_date_from,$str_date_until,$time_unit) {
  $count_expr = "";
  foreach ($lab_horiz as $lab) $count_expr .= ", count(if(H = '$lab',1,null)) ";
  $inner_sql = genInnerQuery($nspace,$horiz,$vertic,$str_date_from,$str_date_until,$time_unit);
  $outer_sql = "select V".$count_expr." from ($inner_sql) X group by 1";
  return $outer_sql;
}

function genInnerQuery($nspace,$horiz,$vertic,$str_date_from,$str_date_until,$time_unit) {
  global $petals;
  
  $sql = "";
  for ($p = 0; $p < count($petals); $p++) {
    $petal = $petals[$p];
    $where = genWhere($petal,$nspace,$str_date_from,$str_date_until);
    $h_field = getField($horiz,$petal,$time_unit);
    $v_field = getField($vertic,$petal,$time_unit);
    $sql .=
      ($p == 0 ? "": " union all ").
      "select $v_field V, $h_field H ".
      "from $petal.$petal"."_page $where";
  }
  return $sql;
}

function getField($attrib,$petal,$time_unit) {
  switch ($attrib) {
    case "P": return "'".ucfirst($petal)."'";
    case "N": return "if (page_namespace = 0,'Page','Category')";
    case "T": 
      switch($time_unit) {
        case "Y": $fld = "year(min(rev_timestamp))"; break;
        case "M": $fld = "concat(year(min(rev_timestamp)),'-',substring(monthname(min(rev_timestamp)),1,3))"; break;
        case "W": $fld = "concat(year(min(rev_timestamp)),'-W',lpad(week(min(rev_timestamp),3),2,0))"; break;
      }
      return "(select $fld from $petal.$petal"."_revision where rev_page = page_id)";
    case "Q": return "'total'"; 
  }
}

function genPetals ($petal) {
  global $petals;

  if ($petal) array_push($petals, $petal);
  else {
    array_push($petals, "vanipedia");
    array_push($petals, "vanisource");
    array_push($petals, "vaniquotes");
  }
}

function genWhere($petal,$nspace,$from,$until) {
  $cond = "page_namespace".($nspace == "C" ? " = 14" : ($nspace == "P" ? " = 0" : " in (0,14)"));
  $where = 
    "where $cond and ".
    "(select date(min(rev_timestamp)) from $petal.$petal"."_revision where rev_page = page_id) between '$from' and '$until'";
  return $where;
}

function getLabels($nspace,$horiz,$vertic,$str_date_from,$str_date_until,$time_unit) {
  global $mysqli;

  $inner_sql = genInnerQuery($nspace,$vertic,$horiz,$str_date_from,$str_date_until,$time_unit); /* NB!! horiz and vertic are switched !! */
  $outer_sql = "select V from ($inner_sql) X group by 1";
  $result = $mysqli->query($outer_sql);
  $labels = [];
  while ($fields = $result->fetch_row()) {
    array_push($labels,$fields[0]);
  }
  return $labels;
}

?>
