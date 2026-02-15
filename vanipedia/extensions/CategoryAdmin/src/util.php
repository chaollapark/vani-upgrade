<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

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

function getCategories($petl_name, $filter, $match_type, $pages_from, $pages_until, $sort_fld, $sort_dir, $offset, $limit, $tot_records) {
  global $mysqli;

  // sort direction
  $dir = ['asc', 'desc'];
  $sort_dir = $dir[$sort_dir] ?? 'asc';

  // sortable columns
  $allowed_sort_fields = ['cat_id','cat_title','cat_pages','cat_subcats'];
  if (!in_array($sort_fld, $allowed_sort_fields, true)) {
    $sort_fld = 'cat_id';
  }

  // database/table name
  if (!preg_match('/^[a-zA-Z0-9_]+$/', $petl_name)) {
    http_response_code(400);
    return json_encode(['error' => 'Invalid database name']);
  }

  $filter = str_replace(' ', '_', $filter);
  $like = null;

  switch ($match_type) {
    case 'contains': $like = "%$filter%"; break;
    case 'ends':   $like = "%$filter";  break;
    case 'starts':   $like = "$filter%";  break;
  }

  $where = [];
  $params = [];
  $types  = '';

  if ($like !== null && $filter !== '') {
    $where[] = "UPPER(CONVERT(cat_title USING latin1)) LIKE UPPER(?)";
    $params[] = $like;
    $types   .= 's';
  }

  $where[] = "cat_pages >= ?";
  $params[] = (int)$pages_from;
  $types   .= 'i';

  if ($pages_until >= 0) {
    $where[] = "cat_pages <= ?";
    $params[] = (int)$pages_until;
    $types   .= 'i';
  }

  $where_sql = 'WHERE ' . implode(' AND ', $where);
  $tot_records = getCount($petl_name, $where_sql, $params, $types);

  $sql = "
    SELECT * FROM 
      (SELECT cat_id, cat_title, (cat_pages - cat_subcats) AS cat_pages, cat_subcats
       FROM {$petl_name}.{$petl_name}_category) q
    $where_sql ORDER BY $sort_fld $sort_dir LIMIT ?, ?
  ";

  $params[] = (int)$offset;
  $params[] = (int)$limit;
  $types   .= 'ii';

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $categories = [];
  while ($row = $result->fetch_assoc()) {
    $categories[] = [
      'cat_id'    => (int)$row['cat_id'],
      'cat_title'   => str_replace('_', ' ', $row['cat_title']),
      'cat_pages'   => (int)$row['cat_pages'],
      'cat_subcats' => (int)$row['cat_subcats']
    ];
  }

  $stmt->close();

  return json_encode(['tot_records' => $tot_records, 'categories' => $categories],JSON_NUMERIC_CHECK);
}

function getCount($petl_name, $where_sql, $params = [], $types = '') {
  global $mysqli;

  $sql = "
    SELECT COUNT(*) FROM (SELECT cat_title, (cat_pages - cat_subcats) cat_pages FROM {$petl_name}.{$petl_name}_category) q
    $where_sql
  ";

  $stmt = $mysqli->prepare($sql);
  if (!$stmt) {
    throw new Exception($mysqli->error);
  }

  if ($params) {
    $stmt->bind_param($types, ...$params);
  }

  $stmt->execute();
  $result = $stmt->get_result();
  $row = $result->fetch_row();

  $stmt->close();

  return (int)$row[0];
}

?>