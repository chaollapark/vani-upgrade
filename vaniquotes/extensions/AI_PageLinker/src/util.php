<?php
include ("inc/db_connect.inc");

require_once '/var/www/vaniquotes/w/includes/WebStart.php';
// Get the current user
$context = RequestContext::getMain();
$user = $context->getUser();

// Now you can get username, user ID, groups, etc.
//echo "Hello, " . $user->getName(); return;

$func = @$_GET['func'];
if ($func == "getPages") {
  $petl_name = @$_POST["petl_name"];
  $filter = @$_POST["filter"];
  $match_type = @$_POST["match_type"];
  $sort_fld = @$_POST["sort_fld"];
  $sort_dir = @$_POST["sort_dir"];
  $offset = @$_POST["offset"];
  $limit = @$_POST["limit"];
  $tot_records = @$_POST["tot_records"];
  $filt_include = @$_POST["filt_include"];
  $result = getPages($petl_name,$filter,$match_type,$sort_fld,$sort_dir,$offset,$limit,$tot_records,$filt_include);
} else if ($func == "updPageLinks_1") {
  $result = updPageLinks_1();
} else if ($func == "updPageLinks_2") {
  $result = updPageLinks_2();
} else if ($func == "updateOneInclude") {
  $sqpl_idQ = @$_POST["sqpl_idQ"];
  $sqpl_include = @$_POST["sqpl_include"];
  $result = updateOneInclude($sqpl_idQ,$sqpl_include);
} else if ($func == "updateManyInclude") {
  $filter = @$_POST["filter"];
  $match_type = @$_POST["match_type"];
  $filt_include = @$_POST["filt_include"];
  $sqpl_include = @$_POST["sqpl_include"];
  $result = updateManyInclude($filter,$match_type,$filt_include,$sqpl_include);
}
echo $result;

function getPages($petl_name,$filter,$match_type,$sort_fld,$sort_dir,$offset,$limit,$tot_records,$filt_include) {
  global $mysqli; $dir = ["asc","desc"];

  $pages = []; 
  $petl_name = $mysqli->real_escape_string($petl_name);
  $filter = str_replace(" ","_",$mysqli->real_escape_string($filter));
  $pages_from = intval($mysqli->real_escape_string($pages_from));
  $pages_until = intval($mysqli->real_escape_string($pages_until));
  $sort_fld = $mysqli->real_escape_string($sort_fld);
  $sort_dir = $dir[$sort_dir];
  $offset = intval($mysqli->real_escape_string($offset));
  $limit = intval($mysqli->real_escape_string($limit));
  
  switch ($match_type) {
    case "contains": $like = "%$filter%"; break;
    case "ends": $like = "%$filter"; break;
    case "starts": $like = "$filter%"; break;
  }
  $where = ($filter ? "where upper(convert(vq.page_title using latin1)) like upper('$like')" : ""); /* convert is necessary because cat_title is of type varbinary */
  switch ($filt_include) {
    case "all": $include = ""; break;
    case "yes": $include = "Y"; break;
    case "no": $include = "N"; break;
    case "maybe": $include = "?"; break;
  }
  if ($include) $where .= ($where ? " and " : "where ")."sqpl_include = '$include'";
  if (!$tot_records) $tot_records = getCount($petl_name,$where);
  
  $sql = 
    "select vq.page_id, vs.page_id, vq.page_title vq_title, vs.page_title vs_title, sqpl_include ".
    "from vp_chat.sqpl ".
    "inner join vaniquotes.vaniquotes_page vq on vq.page_id = sqpl_idQ ".
    "left join vanisource.vanisource_page vs on vs.page_id = sqpl_idS ".
    "$where order by $sort_fld $sort_dir limit $offset,$limit";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($pages, [
      "sqpl_idQ"=>$fields[0], 
      "sqpl_idS"=>$fields[1], 
      "vq_title"=>str_replace("_"," ",$fields[2]),
      "vs_title"=>str_replace("_"," ",$fields[3]),
      "sqpl_include"=>$fields[4],
    ]);
  }
  return json_encode(["tot_records"=>$tot_records,"pages"=>$pages],JSON_NUMERIC_CHECK);
}

function getCount($petl_name,$where) {
  global $mysqli;
  
  $sql = 
    "select count(*) from vaniquotes.vaniquotes_page vq ".
    "inner join vp_chat.sqpl on sqpl_idQ = page_id $where";
  return $mysqli->query($sql)->fetch_row()[0];
}

function updPageLinks_1() {
  global $mysqli; 

  $sql_1 = 
    "select substr(content_address,4) rev_text_id, p.page_id from vaniquotes.vaniquotes_page p ".
    "inner join vaniquotes.vaniquotes_slots on slot_revision_id = page_latest ".
    "inner join vaniquotes.vaniquotes_content on content_id = slot_content_id ".
    "left join vp_chat.sqpl on sqpl_idQ = p.page_id ".
    "where page_namespace = 0 and sqpl_idQ is null";
  $result = $mysqli->query($sql_1);
  while ($fields_1 = $result->fetch_row()) {
    $old_id = $fields_1[0]; $page_id = $fields_1[1]; 
    $sql_2 = "select old_text from vaniquotes.vaniquotes_text where old_id = $old_id";
    $fields_2 = $mysqli->query($sql_2)->fetch_row();
    $text = $fields_2[0];
    if (preg_match('/\{\{total\|1\}\}/', $text)) createSQPL($page_id); /* only single quote pages */
  }
  return 1;
}

function createSQPL($page_id) {
  global $mysqli; 
  
  $sql = "insert into vp_chat.sqpl (sqpl_idQ) values ($page_id)";
  $mysqli->query($sql);
}

function updPageLinks_2() {
  global $mysqli; 

  $sql_1 = 
    "select substr(content_address,4) rev_text_id, p.page_id from vaniquotes.vaniquotes_page p ".
    "inner join vaniquotes.vaniquotes_slots on slot_revision_id = page_latest ".
    "inner join vaniquotes.vaniquotes_content on content_id = slot_content_id ".
    "inner join vp_chat.sqpl on sqpl_idQ = p.page_id ".
    "where sqpl_idS = 0";
  $result = $mysqli->query($sql_1);
  while ($fields_1 = $result->fetch_row()) {
    $old_id = $fields_1[0]; $page_idQ = $fields_1[1]; 
    $sql_2 = "select old_text from vaniquotes.vaniquotes_text where old_id = $old_id";
    $fields_2 = $mysqli->query($sql_2)->fetch_row();
    $text = $fields_2[0];
    if (preg_match('/\[\[Vanisource:([^|\]]+)\|/', $text, $matches)) updateSQPL($page_idQ, str_replace(' ','_',$matches[1]));
  }
  return 1;
}

function updateSQPL($page_idQ, $page_title) {
  global $mysqli; 
  
  $page_title = $mysqli->real_escape_string($page_title);
  $sql = "select page_id from vanisource.vanisource_page where page_title = '$page_title' and page_namespace = 0";
  //echo $sql."\r\n";
  $result = $mysqli->query($sql);
  if (!$result->num_rows) return;
  $page_idS = $result->fetch_row()[0];
  $sql = "update vp_chat.sqpl set sqpl_idS = $page_idS where sqpl_idQ = $page_idQ";
  $mysqli->query($sql);
}

function updateOneInclude($sqpl_idQ,$sqpl_include) {
  global $mysqli, $user;

  if (!$user->isAllowed("wrapcategory")) return 0;
  
  $sqpl_idQ = $mysqli->real_escape_string($sqpl_idQ);
  $sqpl_include = $mysqli->real_escape_string($sqpl_include);
  $sql = "update vp_chat.sqpl set sqpl_include = '$sqpl_include' where sqpl_idQ = $sqpl_idQ";
  $result = $mysqli->query($sql);
  return 1;
}

function updateManyInclude($filter,$match_type,$filt_include,$sqpl_include) {
  global $mysqli, $user; 

  if (!$user->isAllowed("wrapcategory")) return 0;

  $petl_name = "vaniquotes";
  $filter = str_replace(" ","_",$mysqli->real_escape_string($filter));
  $sqpl_include = $mysqli->real_escape_string($sqpl_include);

  switch ($match_type) {
    case "contains": $like = "%$filter%"; break;
    case "ends": $like = "%$filter"; break;
    case "starts": $like = "$filter%"; break;
  }
  $where = ($filter ? 
    "where upper(convert(page_title using latin1)) like upper('$like')" : 
    ""); /* convert is necessary because cat_title is of type varbinary */
  switch ($filt_include) {
    case "all": $include = ""; break;
    case "yes": $include = "Y"; break;
    case "no": $include = "N"; break;
    case "maybe": $include = "?"; break;
  }
  $and = ($include ? "and sqpl_include = '$include'" : "");
    
  $sql = 
    "update vp_chat.sqpl set sqpl_include = '$sqpl_include' where sqpl_idQ in ".
    "(select page_id from $petl_name.$petl_name"."_page $where) $and";
  $result = $mysqli->query($sql);
  return 1;
}

?>