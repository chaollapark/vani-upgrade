<?php

function log_search ($type, $target, $op, $ww, $ds, $vp, $vq, $vs, $lang) {
  global $mysqli;
  
  $ip = $_SERVER["REMOTE_ADDR"];
  
  $sql = "select ifnull(max(lang_id),0) from vp_search.lang where lang_code = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $lang);
  $stmt->execute();
  $result = $stmt->get_result();
  $fields = $result->fetch_array();
  $lang_id = $fields[0];

  $sql =
    "insert into vp_search.slog (slog_type,slog_target,slog_operator,slog_ww,slog_ds,slog_vp,slog_vq,slog_vs,lang_id,slog_ip) ".
    "values (?, ?, ?, ?, ?, ?, ?, ?, $lang_id, '$ip') "; 
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('sssiiiii', $type, $target, $op, $ww, $ds, $vp, $vq, $vs);
  $stmt->execute();
}

?>