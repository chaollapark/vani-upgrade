<?php
include ("inc/db_connect.inc");

require_once '/var/www/vaniquotes/w/includes/WebStart.php';
// Get the current user
$context = RequestContext::getMain();
$user = $context->getUser();

// Now you can get username, user ID, groups, etc.
//echo "Hello, " . $user->getName(); return;

$func = @$_GET['func'];
if ($func == "getCategories") {
  $petl_name = @$_POST["petl_name"];
  $filter = @$_POST["filter"];
  $match_type = @$_POST["match_type"];
  $pages_from = @$_POST["pages_from"];
  $pages_until = @$_POST["pages_until"];
  $sort_fld = @$_POST["sort_fld"];
  $sort_dir = @$_POST["sort_dir"];
  $offset = @$_POST["offset"];
  $limit = @$_POST["limit"];
  $tot_records = @$_POST["tot_records"];
  $filt_include = @$_POST["filt_include"];
  $result = getCategories($petl_name,$filter,$match_type,$pages_from,$pages_until,$sort_fld,$sort_dir,$offset,$limit,$tot_records,$filt_include);
} else if ($func == "genWrapRecords") {
  $result = genWrapRecords("vaniquotes");
} else if ($func == "updateOneInclude") {
  $catg_id = @$_POST["catg_id"];
  $catg_include = @$_POST["catg_include"];
  $result = updateOneInclude($catg_id,$catg_include);
} else if ($func == "updateManyInclude") {
  $filter = @$_POST["filter"];
  $match_type = @$_POST["match_type"];
  $pages_from = @$_POST["pages_from"];
  $pages_until = @$_POST["pages_until"];
  $filt_include = @$_POST["filt_include"];
  $catg_include = @$_POST["catg_include"];
  $result = updateManyInclude($filter,$match_type,$pages_from,$pages_until,$filt_include,$catg_include);
}
echo $result;

function getCategories($petl_name,$filter,$match_type,$pages_from,$pages_until,$sort_fld,$sort_dir,$offset,$limit,$tot_records,$filt_include) {
  global $mysqli; $dir = ["asc","desc"];

  $categories = []; 
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
  $where = ($filter ? "where upper(convert(cat_title using latin1)) like upper('$like')" : ""); /* convert is necessary because cat_title is of type varbinary */
  $where .= ($where ? " and " : "where ").
    "cat_pages >= $pages_from".
    ($pages_until < 0 ? "" : " and cat_pages <= $pages_until");
  switch ($filt_include) {
    case "all": $include = ""; break;
    case "yes": $include = "Y"; break;
    case "no": $include = "N"; break;
    case "maybe": $include = "?"; break;
  }
  if ($include) $where .= ($where ? " and " : "where ")."catg_include = '$include'";
  if (!$tot_records) $tot_records = getCount($petl_name,$where);
  
  $sql = 
    "select * from (".
    "select cat_id, cat_title, (cat_pages - cat_subcats) cat_pages, cat_subcats, c2.catg_include from $petl_name.$petl_name"."_category c1 ".
    "inner join vp_chat.catg c2 on c1.cat_id = c2.catg_id) q ".
    "$where order by $sort_fld $sort_dir limit $offset,$limit";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($categories, [
      "cat_id"=>$fields[0], 
      "cat_title"=>str_replace("_"," ",$fields[1]),
      "cat_pages"=>$fields[2],
      "cat_subcats"=>$fields[3],
      "cat_include"=>$fields[4],
    ]);
  }
  return json_encode(["tot_records"=>$tot_records,"categories"=>$categories],JSON_NUMERIC_CHECK);
}

function getCount($petl_name,$where) {
  global $mysqli;
  
  $sql = 
    "select count(*) from $petl_name.$petl_name"."_category c1 ".
    "inner join vp_chat.catg c2 on c1.cat_id = c2.catg_id $where";
  return $mysqli->query($sql)->fetch_row()[0];
}

function genWrapRecords($petl_name) {
  global $mysqli; 

  $sql = 
    "insert into vp_chat.catg (catg_id) ".
    "select cat_id from $petl_name.$petl_name"."_category c1 ".
    "left join vp_chat.catg c2 on c1.cat_id = c2.catg_id ".
    "where c2.catg_id is null order by cat_id";
  $result = $mysqli->query($sql);
  return 1;
}

function updateOneInclude($catg_id,$catg_include) {
  global $mysqli, $user;

  if (!$user->isAllowed("wrapcategory")) return 0;
  
  $catg_id = $mysqli->real_escape_string($catg_id);
  $catg_include = $mysqli->real_escape_string($catg_include);
  $sql = "update vp_chat.catg set catg_include = '$catg_include' where catg_id = $catg_id";
  $result = $mysqli->query($sql);
  return 1;
}

function updateManyInclude($filter,$match_type,$pages_from,$pages_until,$filt_include,$catg_include) {
  global $mysqli, $user; 

  if (!$user->isAllowed("wrapcategory")) return 0;

  $petl_name = "vaniquotes";
  $filter = str_replace(" ","_",$mysqli->real_escape_string($filter));
  $pages_from = intval($mysqli->real_escape_string($pages_from));
  $pages_until = intval($mysqli->real_escape_string($pages_until));
  $catg_include = $mysqli->real_escape_string($catg_include);

  switch ($match_type) {
    case "contains": $like = "%$filter%"; break;
    case "ends": $like = "%$filter"; break;
    case "starts": $like = "$filter%"; break;
  }
  $where = ($filter ? "where upper(convert(cat_title using latin1)) like upper('$like')" : ""); /* convert is necessary because cat_title is of type varbinary */
  $where .= ($where ? " and " : "where ").
    "cat_pages - cat_subcats >= $pages_from".
    ($pages_until < 0 ? "" : " and cat_pages - cat_subcats <= $pages_until");
  switch ($filt_include) {
    case "all": $include = ""; break;
    case "yes": $include = "Y"; break;
    case "no": $include = "N"; break;
    case "maybe": $include = "?"; break;
  }
  $and = ($include ? "and catg_include = '$include'" : "");
    
  $sql = 
    "update vp_chat.catg set catg_include = '$catg_include' where catg_id in ".
    "(select cat_id from $petl_name.$petl_name"."_category $where) $and";
  $result = $mysqli->query($sql);
  return 1;
}

?>