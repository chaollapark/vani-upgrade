<?php
include ("inc/db_connect.php");
include ("inc/count_quotes.php");

$func = @$_GET['func'];
if ($func == "getVaniTypes") {
  $result = getVaniTypes();
} else if ($func == "getVanis") {
  $vtyp_id = @$_GET['vtyp_id'];
  $filter = @$_GET['filter'];
  $result = getVanis($vtyp_id,$filter);
} else if ($func == "getVqSections") {
  $result = getVqSections();
} else if ($func == "getVqHistory") {
  $result = getVqHistory();
} else if ($func == "countVaniLinks") {
  $vani_id = @$_GET["vani_id"];
  $result = countVaniLinks($vani_id);
} else if ($func == "countQuotes") {
  $sections = json_decode(@$_GET["sections"],true); /* 2nd param = true converts stdobject to array */
  $result = countQuotes($sections,"M");
}


echo $result;

function getVaniTypes() {
  global $mysqli;

  $vanitypes = []; 
  $sql = "select vtyp_id, vtyp_name from vtyp ";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    $vanitypes[$fields[0]] = $fields[1];
  }
  return json_encode($vanitypes,JSON_NUMERIC_CHECK);
}

function getVanis($vtyp_id,$filter) {
  global $mysqli;

  $vanis = []; 
  $filter = strtolower($mysqli->real_escape_string($filter));
  $where = 
    "where ".($vtyp_id ? "vtyp_id = $vtyp_id" : "true").
    ($filter ? " and lower(vani_name) like '%$filter%'" : "");
  $sql_pages = "(select count(*) from vnpg p where p.vani_id = v.vani_id)";
  $sql = "select vani_id, vani_name, vani_tag, vani_links, $sql_pages from vani v $where order by vani_name";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($vanis, [
      "vani_id"=>$fields[0], 
      "vani_name"=>$fields[1],
      "vani_tag"=>$fields[2],
      "vani_links"=>$fields[3],
      "vani_pages"=>$fields[4],
      "vani_select"=>false,
      "links_col"=>null
    ]);
  }
  return json_encode($vanis,JSON_NUMERIC_CHECK);
}

function countVaniLinks($vani_id) {
  global $mysqli;

  $links = 0;
  $sql = 
    "select count(*) from vaniquotes.vaniquotes_iwlinks ".
    "inner join vanisource.vanisource_page p on page_namespace = 0 and page_title = iwl_title ".
    "inner join vp_search.vnpg v on v.page_id = p.page_id and vani_id = $vani_id ".
    "where iwl_prefix = 'vanisource' ".
    "group by vani_id";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) $links += $fields[0];
  $sql = "update vp_search.vani set vani_links = $links where vani_id = $vani_id";
  $mysqli->query($sql);
  return json_encode(["vani_links"=>$links],JSON_NUMERIC_CHECK);
}

function getVqSections() {
  global $mysqli;

  $sections = []; 
  $sql_pages = "(select count(distinct p.page_id) from vnpg p inner join vani v using(vani_id) where v.vquo_id = q.vquo_id)";
  $sql = "select vquo_id, vquo_seq, vquo_code, vquo_desc, vquo_links, $sql_pages from vquo q order by vquo_seq";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($sections, [
      "vquo_id"=>$fields[0], 
      "vquo_seq"=>$fields[1], 
      "vquo_code"=>$fields[2],
      "vquo_desc"=>$fields[3],
      "vquo_links"=>$fields[4],
      "vquo_pages"=>$fields[5],
      "vquo_select"=>false,
      "links_col"=>null
    ]);
  }
  return json_encode($sections,JSON_NUMERIC_CHECK);
}

function getVqHistory() {
  global $mysqli;

  $history = []; 
  $method = "case vqhi_method when 'A' then 'automatic' when 'M' then 'manual' end";
  $sql = "select vqhi_id, vqhi_time, $method from vqhi order by vqhi_time desc";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($history, [
      "vqhi_id"=>$fields[0], 
      "vqhi_time"=>$fields[1], 
      "vqhi_method"=>$fields[2]
    ]);
  }
  return json_encode($history,JSON_NUMERIC_CHECK);
}

?>