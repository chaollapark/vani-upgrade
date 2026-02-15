<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include ("inc/db_connect.inc");

$params = []; $types = '';

$func = @$_GET['func'];
if ($func == "get_pages") {
  $petal = @$_GET['petal'];
  $nspace = @$_GET['nspace'];
  $type = @$_GET['type'];
  $rpp = @$_GET['rpp'];
  $ofs = @$_GET['ofs'];
  $sort = json_decode(@$_GET['sort']);
  $html = get_pages($petal, $nspace, $type, $rpp, $ofs, $sort);
}
else if ($func == "get_count") {
  $petal = @$_GET['petal'];
  $nspace = @$_GET['nspace'];
  $type = @$_GET['type'];
  $html = get_count($petal, $nspace, $type);
}
else if ($func == "get_total") {
  $petal = @$_GET['petal'];
  $nspace = @$_GET['nspace'];
  $html = get_total($petal,$nspace);
}
else if ($func == "get_history") {
  $petal = @$_GET['petal'];
  $page_id = @$_GET['page_id'];
  $html = get_history($petal, $page_id);
}
else if ($func == "space_gain") {
  $range = json_decode(@$_POST['range']);
  $petal = @$_GET['petal'];
  $del_until = @$_GET['del_until'];
  $preserve_first = @$_GET['preserve_first'];
  $html = get_space_gain($range, $petal, $del_until, $preserve_first);
}
else if ($func == "del_history") {
  $range = json_decode(@$_POST['range']);
  $petal = @$_GET['petal'];
  $del_until = @$_GET['del_until'];
  $preserve_first = @$_GET['preserve_first'];
  $html = del_history($range, $petal, $del_until, $preserve_first);
}

echo $html; return;

function petal_ok($petal) {
  return in_array($petal, ['vanipedia','vaniquotes','vanisource']);
}

function sort_ok($sort) {
  return in_array($sort->type, ['rev','space']);
}

function get_pages($petal, $nspace, $type, $rpp, $ofs, $sort) {
  global $mysqli, $params, $types;

  if (!petal_ok($petal) || !sort_ok($sort)) return 0;
  $sql = sql_pages($petal, $nspace, $type, $rpp, $ofs, $sort);
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $list = [];
  while ($values = $result->fetch_row()) {
    $list[] = [
      "id" => $values[0], 
      "title" => $values[1], 
      "count" => $values[2], 
      "size" => $values[3]];
  }
  return json_encode($list);
}

function get_history($petal, $page_id) {
  global $mysqli, $params, $types;

  if (!petal_ok($petal)) return 0;
  $sql = sql_history($petal, $page_id);

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();

  $list = [];
  while ($values = $result->fetch_row()) {
    $list[] = [
      "time" => $values[0], 
      "user" => $values[1], 
      "size" => $values[2]];
  }
  return json_encode($list);
}

function sql_pages($petal, $nspace, $type, $rpp, $ofs, $sort) {
  global $params, $types;
  
  $order = "order by $sort->type ".["asc","desc"][$sort->sort]." limit ?, ?";
  if ($type == "one")
    $sql =
      "select page_id, page_title, 1 rev, rev_len space from $petal.$petal"."_page ".
      "inner join $petal.$petal"."_revision on page_latest = rev_id ".
      "where page_namespace = ? $order";
  else if ($type == "all")
    $sql =
      "select page_id, page_title, count(rev_len) rev, sum(rev_len) space from $petal.$petal"."_page ".
      "inner join $petal.$petal"."_revision on page_id = rev_page ".
      "where page_namespace = ? group by page_id, page_title $order";
      
  $params = [$nspace,$ofs,$rpp];
  $types = 'iii';

  return $sql;    
}

function get_count($petal, $nspace, $type) {
  global $mysqli;

  if (!petal_ok($petal)) return 0;
  if ($type == "one")
    $sql =
      "select count(*) from $petal.$petal"."_page p ".
      "inner join $petal.$petal"."_revision r on p.page_latest = r.rev_id ".
      "where p.page_namespace = ?";
  else if ($type == "all")
    $sql =
      "select count(*) from (select 1 from $petal.$petal"."_page p ".
      "inner join $petal.$petal"."_revision r on p.page_id = r.rev_page ".
      "where p.page_namespace = ? group by p.page_id) S ";
  else return 0;
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('i', $nspace);
  $stmt->execute();
  $result = $stmt->get_result();

  $values = $result->fetch_row();
  return json_encode($values[0]);
}

function get_total($petal,$nspace) {
  global $mysqli;

  if (!petal_ok($petal)) return 0;
  $sql =
    "select sum(rev_len) from $petal.$petal"."_revision ".
    "inner join $petal.$petal"."_page on rev_page = page_id ".
    "where page_namespace = ?";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('i', $nspace);
  $stmt->execute();
  $result = $stmt->get_result();

  $values = $result->fetch_row();
  return json_encode($values[0]);
}

function sql_history($petal, $page_id) {
  global $params, $types;

  $sql =
    "select rev_timestamp, actor_name, rev_len from $petal.$petal"."_revision ".
    "inner join $petal.$petal"."_actor on rev_actor = actor_id ".
    "where rev_page = ? order by rev_timestamp desc ";

  $params = [$page_id]; $types = 'i';
  return $sql;
}

function get_space_gain($range, $petal, $del_until, $preserve_first) {
  global $mysqli;
  
  // prevent SQL injection
  if (!petal_ok($petal)) return 0;
  $range = array_filter($range, function ($v) { return filter_var($v, FILTER_VALIDATE_INT) !== false; }); 

  $in = implode(",", $range);
  $date = explode("-", $del_until);
  $timestamp = $date[0].$date[1].$date[2];
  $sql = 
    "select ifnull(sum(rev_len),0) from $petal.$petal"."_revision a ".
    "inner join $petal.$petal"."_page on page_id = rev_page ".
    "where rev_page in ($in) and (rev_id <> page_latest) ".
    "and (rev_timestamp < ?) ";
  if ($preserve_first) {
    $sql .= 
      "and (rev_timestamp > ".
      "(select min(rev_timestamp) from $petal.$petal"."_revision b ".
      " where b.rev_page = a.rev_page))";
  }

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $timestamp);
  $stmt->execute();
  $result = $stmt->get_result();

  $values = $result->fetch_row();
  return json_encode($values[0]);
}


function XXdel_historyXX($range, $petal, $del_until, $preserve_first) { /* renamed for safety reasons */
  global $mysqli; $rev_ids = []; $text_ids = [];
  
  /* todo: why is the permission test commented out? (for now, the delete button is disabled) */
  // if (!in_array("revmanage", get_user_rights()))
  // return '{"status":"error","message":"Permission denied!"}';

  // prevent SQL injection
  if (!petal_ok($petal)) return 0;
  $range = array_filter($range, function ($v) { return filter_var($v, FILTER_VALIDATE_INT) !== false; }); 
  $range = array_values($range);

  $in = implode(",", $range);
  $date = explode("-", $del_until);
  $timestamp = $date[0].$date[1].$date[2];
  $sql = 
    "select rev_id, substr(content_address,4) from $petal.$petal"."_revision a ".
    "inner join $petal.$petal"."_page on page_id = rev_page ".
    "inner join $petal.$petal"."_slots on slot_revision_id = rev_id ".
    "inner join $petal.$petal"."_content on content_id = slot_content_id ".
    "where rev_page in ($in) and (rev_id <> page_latest) ";
    "and (rev_timestamp < ?) "; /* todo: check if AND condition is necessary */
  if ($preserve_first) {
    $sql .= 
      "and (rev_timestamp > ".
      "(select min(rev_timestamp) from $petal.$petal"."_revision b ".
      " where b.rev_page = a.rev_page))";
  }
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $timestamp);
  $stmt->execute();
  $result = $stmt->get_result();
  
  while ($values = $result->fetch_row()) {
    $rev_ids[] = $values[0];
    $text_ids[] = $values[1];
  }

  if (empty($rev_ids)) {
    return '{"status":"no revisions found"}';
  }

  $mysqli->autocommit(false);
  $mysqli->begin_transaction();
  $in = implode(",", $rev_ids);
  
  $mysqli->query("DELETE FROM $petal.$petal"."_revision_actor_temp WHERE revactor_rev IN ($in)");
  $mysqli->query("DELETE FROM $petal.$petal"."_slots WHERE slot_revision_id IN ($in)");
  $mysqli->query("DELETE FROM $petal.$petal"."_revision WHERE rev_id IN ($in)");
  $mysqli->query("DELETE FROM $petal.$petal"."_archive WHERE ar_rev_id IN ($in)");
  
  del_texts($petal, $text_ids);
  $mysqli->commit();
  return '{"status":"ok"}';
}

function xxxdel_texts($petal, $text_ids) {
  global $mysqli; 
  
  if (empty($text_ids)) return;
  $in = implode(",", $text_ids);
  $sql = "delete from $petal.$petal"."_text where old_id in ($in)";
  $mysqli->query($sql);
  
//  $cont_adr = implode(",", array_map(fn($id) => "'tt:$id'", $text_ids));
//  $cont_adr = implode(",", array_map(fn($id) => "'tt:$id'", $text_ids));

  $mysqli->query("DELETE FROM $petal.$petal"."_content WHERE content_address IN ($cont_adr)");
}

function del_texts($petal, $text_ids) {
    global $mysqli;

    if (empty($text_ids)) return;

    // Ensure all IDs are integers (safety against injection)
    $text_ids = array_map('intval', $text_ids);

    // Delete from vaniquotes_text
    $in = implode(',', $text_ids);
    $sql = "DELETE FROM $petal.$petal"."_text WHERE old_id IN ($in)";
    $mysqli->query($sql);

    // Prepare content addresses like 'tt:1234'
    $addresses = array_map(function($id) {
        return "'tt:$id'";
    }, $text_ids);
    $cont_adr = implode(',', $addresses);

    // Delete from vaniquotes_content
    $sql = "DELETE FROM $petal.$petal"."_content WHERE content_address IN ($cont_adr)";
    $mysqli->query($sql);
}


function insert_tt($item)
{
  return "'tt:$item'";
}

?>
