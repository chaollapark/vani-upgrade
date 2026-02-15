<?php

function update_setup ($mysqli, $tran_catg, $tran_code, $tran_text, $lang_code) {
  // determine if a translation exists
  $sql = "select ifnull(max(tran_id),0) from vp_translate.tran where tran_code = ? and tran_lang = ?";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('ss', $tran_code, $lang_code);
  $stmt->execute();
  $result = $stmt->get_result();

  $fields = $result->fetch_array();
  $tran_idT = $fields[0];
  
  if ($tran_idT == 0) 
    $result = tran_insert ($mysqli, $tran_catg, $tran_code, $tran_text, $lang_code);
  elseif ($tran_text == "") 
    $result = tran_delete ($mysqli, $tran_idT);
  else 
    $result = tran_update ($mysqli, $tran_idT, $tran_text);

  return $result;
}

function tran_insert ($mysqli, $tran_catg, $tran_code, $tran_text, $lang_code) {
  if ($tran_text == "") return '{"idT":0}';

  $sql =
    "insert into vp_translate.tran (tran_catg, tran_lang, tran_code, tran_text) ".
    "values(?, ?, ?, ?)";
    
  $mysqli->begin_transaction();
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('isss', $tran_catg, $lang_code, $tran_code, $tran_text);
  $stmt->execute();

  $sql = "select max(tran_id) from vp_translate.tran";
  $tran_id = $mysqli->query($sql)->fetch_row()[0];
  $mysqli->commit();

  return '{"idT":'.$tran_id.'}';
}

function tran_update ($mysqli, $tran_idT, $tran_text) {
  $sql = "update vp_translate.tran set tran_text = ? where tran_id = $tran_idT";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $tran_text);
  $stmt->execute();

  return '{"idT":'.$tran_idT.'}';
}

function tran_delete ($mysqli, $tran_idT) {
  $sql = "delete from vp_translate.tran where tran_id = $tran_idT";
  $result = $mysqli->query($sql);
  
  return '{"idT":0}';
}

?>