<?php
include ("inc/db_connect.inc");

loop_pages("vanisource");

function loop_pages($petal) {
  global $mysqli;
  
  $sql = "select page_id from $petal.$petal"."_page ";
  $result = $mysqli->query($sql);
  $times = 0; $cnt = 0; $range = [];
  while ($values = $result->fetch_row()) {
    array_push($range, $values[0]);
    $cnt++;
    if ($cnt >= 1000) {
      del_history($range,$petal);
      $times++;
      echo $times."\r\n";
      $cnt = 0; $range = [];
    }
  }
  if (count($range)) {
    del_history($range,$petal);
    $times++;
    echo $times."\r\n";
  }
}

function del_history($range,$petal) {
  global $mysqli; $rev_ids = []; $text_ids = [];
  
  $in = implode(",", $range);
  $sql = 
    "select rev_id, rev_text_id from $petal.$petal"."_revision a ".
    "inner join $petal.$petal"."_page on page_id = rev_page ".
    "where rev_page in ($in) and (rev_id <> page_latest) ".
    "and (rev_timestamp > ".
    "(select min(rev_timestamp) from $petal.$petal"."_revision b ".
    " where b.rev_page = a.rev_page))";

  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    array_push($rev_ids, $values[0]);
    array_push($text_ids, $values[1]);
  }
  
  $mysqli->autocommit(false);
  $mysqli->begin_transaction();
  $in = implode(",", $rev_ids);
  $sql = 
    "delete from $petal.$petal"."_revision_actor_temp where revactor_rev in ($in)";
  $mysqli->query($sql);
  $sql = 
    "delete from $petal.$petal"."_archive where ar_rev_id in ($in)";
  $mysqli->query($sql);
  $sql = 
    "delete from $petal.$petal"."_revision where rev_id in ($in)";
  $mysqli->query($sql);
  del_texts($petal, $text_ids);
  $mysqli->commit();
}

function del_texts($petal, $text_ids) {
  global $mysqli; 
  
  $in = implode(",", $text_ids);
  $sql = 
    "delete from $petal.$petal"."_text where old_id in ($in) ".
    "and not exists ".
    "(select 1 from $petal.$petal"."_revision ".
    " where rev_text_id = old_id)";
    "and not exists ".
    "(select 1 from $petal.$petal"."_archive ".
    " where ar_text_id = old_id)";
  $mysqli->query($sql);
  
  $cont_adr = implode(",", array_map('insert_tt', $text_ids));
  $sql =
    "delete from $petal.$petal"."_content where content_address in ($cont_adr)";
  $mysqli->query($sql);
}

?>