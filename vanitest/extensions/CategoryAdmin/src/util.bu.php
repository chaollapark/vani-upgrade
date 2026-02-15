<?php
include ("inc/db_connect.inc");

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
  $result = getCategories($petl_name,$filter,$match_type,$pages_from,$pages_until,$sort_fld,$sort_dir,$offset,$limit,$tot_records);
} 
echo $result;

function getCategories($petl_name,$filter,$match_type,$pages_from,$pages_until,$sort_fld,$sort_dir,$offset,$limit,$tot_records) {
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
  if (!$tot_records) $tot_records = getCount($petl_name,$where);
  $sql = 
    "select * from (".
    "select cat_id, cat_title, (cat_pages - cat_subcats) cat_pages, cat_subcats from $petl_name.$petl_name"."_category) q ".
    "$where order by $sort_fld $sort_dir limit $offset,$limit";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($categories, [
      "cat_id"=>$fields[0], 
      "cat_title"=>str_replace("_"," ",$fields[1]),
      "cat_pages"=>$fields[2],
      "cat_subcats"=>$fields[3]
    ]);
  }
  return json_encode(["tot_records"=>$tot_records,"categories"=>$categories],JSON_NUMERIC_CHECK);
}

function getCount($petl_name,$where) {
  global $mysqli;
  
  $sql = 
    "select count(*) from (".
    "select cat_title, (cat_pages - cat_subcats) cat_pages from $petl_name.$petl_name"."_category) q $where";
  return $mysqli->query($sql)->fetch_row()[0];
}

?>