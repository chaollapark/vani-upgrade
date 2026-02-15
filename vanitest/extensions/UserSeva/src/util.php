<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include ("inc/db_connect.inc");

$func = @$_GET['func'];
if ($func == "get_users") {
  $petal = @$_GET['petal'];
  $filt = @$_GET['filt'];
  $html = get_users($petal, $filt);
} else if ($func == "get_pages") {
  $petal = @$_GET['petal'];
  $user = @$_GET['user'];
  $rpp = @$_GET['rpp'];
  $ofs = @$_GET['ofs'];
  $nspace = @$_GET['nspace'];
  $filt = @$_GET['filt'];
  $sort = json_decode(@$_GET['sort']);
  $html = get_pages($petal, $user, $rpp, $ofs, $nspace, $filt, $sort);
} else if ($func == "page_count") {
  $petal = @$_GET['petal'];
  $user = @$_GET['user'];
  $nspace = @$_GET['nspace'];
  $filt = @$_GET['filt'];
  $html = page_count($petal, $user, $nspace, $filt);
} 

echo $html; return;

function petal_ok($petal) {
  return in_array($petal, ['vanipedia','vaniquotes','vanisource','vanimedia']);
}

function get_users($petal, $filt) {
  global $mysqli;

  if (!petal_ok($petal)) return 0;
  
  $params = []; $types = ''; $where = '';
  if ($filt) {
    $like = '%'.strtolower($filt).'%';
    $where = 'where lower(convert(user_name using utf8mb4)) like ? ';
    $params[] = $like; $types .= 's';
  }

  $sql = 
    "select user_id, user_name, user_real_name, user_email, user_registration, user_editcount, ".

    "  (select count(distinct rev_page) from $petal.$petal"."_page ". /* the join to page is needed because of orphan revisions */
    "   inner join $petal.$petal"."_revision on rev_page = page_id ".
    "   where rev_actor = user_id) tot_pages, ".
    
    "  (select ifnull(max(rev_timestamp),'00000000') from $petal.$petal"."_page ".
    "   inner join $petal.$petal"."_revision on rev_page = page_id ".
    "   where rev_actor = user_id) rev_last ".
    "from $petal.$petal"."_user $where order by user_name ";

  $stmt = $mysqli->prepare($sql);
  if ($types) $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $users = []; 
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $name = $values[1]; $real = $values[2]; 
    $email = $values[3]; $regist = $values[4]; 
    $tot_edits = $values[5]; $tot_pages = $values[6]; $rev_last = $values[7];
    $users[$id] = [
      "name" => $name, 
      "real" => $real, 
      "email" => $email, 
      "regist" => $regist, 
      "tot_edits" => $tot_edits,
      "tot_pages" => $tot_pages,
      "rev_last" => $rev_last,
    ]; 
  }
  return json_encode($users);
}

function get_pages($petal, $user, $rpp, $ofs, $nspace, $filt, $sort) {
  global $mysqli;

  if (!petal_ok($petal)) return 0;
  
  $params = []; $types = ''; $where = 'where rev_actor = ?';
  $params[] = $user; $types .= 'i';
  if ($filt) {
    $like = '%'.strtolower($filt).'%';
    $where .= ' and lower(convert(page_title using utf8mb4)) like ?';
    $params[] = $like; $types .= 's';
  }
  if ($nspace > -1) {
    $where .= ' and page_namespace = ?';
    $params[] = $nspace; $types .= 'i';
  }

  $sql = 
    "select page_id id, page_title title, page_namespace nspace, count(*) tot_revs, max(rev_timestamp) rev_last from $petal.$petal"."_page ".
    "inner join $petal.$petal"."_revision on rev_page = page_id $where group by page_id, page_title ".
    "order by $sort->type ".["asc","desc"][$sort->sort]." limit ?, ?";
  $params[] = $ofs; $types .= 'i';
  $params[] = $rpp; $types .= 'i';
  
  $stmt = $mysqli->prepare($sql);
  if ($types) $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();

  $pages = []; 
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $title = $values[1]; $nspace = $values[2]; 
    $tot_revs = $values[3]; $rev_last = $values[4];
    $pages[$id] = [
      "title" => $title, 
      "nspace" => $nspace,
      "tot_revs" => $tot_revs,
      "rev_last" => $rev_last,
    ]; 
  }
  return json_encode($pages);
}

function page_count($petal, $user, $nspace, $filt) {
  global $mysqli;
  
  if (!petal_ok($petal)) return 0;
  
  $params = []; $types = ''; $where = 'where rev_actor = ?';
  $params[] = $user; $types .= 'i';
  if ($filt) {
    $like = '%'.strtolower($filt).'%';
    $where .= ' and lower(convert(page_title using utf8mb4)) like ?';
    $params[] = $like; $types .= 's';
  }
  if ($nspace > -1) {
    $where .= ' and page_namespace = ?';
    $params[] = $nspace; $types .= 'i';
  }

  $sql = 
    "select count(*) from (select 1 from $petal.$petal"."_page ".
    "inner join $petal.$petal"."_revision on rev_page = page_id ".
    "$where group by page_id, page_title) s";

  $stmt = $mysqli->prepare($sql);
  if ($types) $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();

  $values = $result->fetch_row();
  return json_encode($values[0]);
}

?>