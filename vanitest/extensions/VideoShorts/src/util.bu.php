<?php
include ("inc/db_connect.php");

$func = @$_GET['func'];
if ($func == "getLanguages") {
  $result = getLanguages();
} else if ($func == "getTransCodes") {
  $lang_code = @$_GET['lang_code'];
  $result = getTransCodes($lang_code);
} else if ($func == "getVideos") {
  $lang_code = @$_GET['lang_code'];
  $result = getVideos($lang_code);
} else if ($func == "getLines") {
  $vish_id = @$_GET['vish_id'];
  $result = getLines($vish_id);
} else if ($func == "getEnglish") {
  $vish_code = @$_GET['vish_code'];
  $vsli_seq = @$_GET['vsli_seq'];
  $result = getEnglish($vish_code,$vsli_seq);
} else if ($func == "vshSubmit") {
  $sess_key = @$_GET['sess_key'];
  $creating = @$_GET['creating'];
  $lang_code = @$_GET['lang_code'];
  $vish = json_decode($_POST['vish']);
  $result = vshSubmit($sess_key,$creating,$lang_code,$vish);
} else if ($func == "vshDelete") {
  $sess_key = @$_GET['sess_key'];
  $vish_id = @$_GET['vish_id'];
  $result = vshDelete($sess_key,$vish_id);
} else if ($func == "vliSubmit") {
  $sess_key = @$_GET['sess_key'];
  $creating = @$_GET['creating'];
  $vsli = json_decode($_POST['vsli']);
  $result = vliSubmit($sess_key,$creating,$vsli);
} else if ($func == "vliDelete") {
  $sess_key = @$_GET['sess_key'];
  $vsli_id = @$_GET['vsli_id'];
  $result = vliDelete($sess_key,$vsli_id);
} else if ($func == "vliSwap") {
  $sess_key = @$_GET['sess_key'];
  $vish_id = @$_GET['vish_id'];
  $seqA = @$_GET['seqA'];
  $seqB = @$_GET['seqB'];
  $result = vliSwap($sess_key,$vish_id,$seqA,$seqB);
} else if ($func == "vshReady") {
  $sess_key = @$_GET['sess_key'];
  $vish_id = @$_GET['vish_id'];
  $vish_ready = @$_GET['vish_ready'];
  $result = vshReady($sess_key,$vish_id,$vish_ready);
  
}
echo $result;

function hasPermission($sess_key, $right) {
  global $mysqli;
  
  $sess_key = $mysqli->real_escape_string($sess_key);
  $right = $mysqli->real_escape_string($right);
  
  $sql = "select 1 from sess where sess_key = '$sess_key' and sess_rights like '%$right%'";
  return $mysqli->query($sql)->num_rows;
}

function getLanguages() {
  global $mysqli;

  $languages = []; 
  $sql = 
    "select lang_code, lang_english from vp_search.lang ".
    "where lang_show = 1 and lang_code <> 'en' order by lang_english";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    $languages[$fields[0]] = $fields[1];
  }
  return json_encode($languages,JSON_NUMERIC_CHECK);
}

function getTransCodes($lang_code) {
  global $mysqli;

  $lang_code = $mysqli->real_escape_string($lang_code);
  $codes = []; 
  $sql = 
    "select vish_code, vish_code from vish A inner join vp_search.lang using(lang_id) ".
    "where vish_ready = 1 and lang_code = 'en' and not exists ".
    "(select 1 from vish B inner join vp_search.lang using(lang_id) ".
    " where lang_code = '".$lang_code."' and A.vish_code = B.vish_code) ".
    "order by vish_code";
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    $codes[$fields[0]] = $fields[1];
  }
  return json_encode($codes);
}

function getVideos($lang_code) {
  global $mysqli;

  $videos = []; 
  $lang_code = $mysqli->real_escape_string($lang_code);
  $sql = 
    "select vish_id, vish_code, vish_title, vish_ref, vish_url, vish_date, vish_ready ".
    "from vish inner join vp_search.lang using(lang_id) where lang_code = '$lang_code'";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    array_push($videos, [
      "vish_id"=>$values[0], 
      "vish_code"=>$values[1],
      "vish_title"=>$values[2],
      "vish_ref"=>$values[3],
      "vish_url"=>$values[4],
      "vish_date"=>$values[5],
      "vish_ready"=>(int)$values[6]
    ]);
  }
  return json_encode($videos);
}

function getLines($vish_id) {
  global $mysqli;

  $lines = []; 
  $vish_id = $mysqli->real_escape_string($vish_id);
  $sql = 
    "select vsli_id, lpad(vsli_seq,2,'0'), vsli_text ".
    "from vsli where vish_id = $vish_id order by vsli_seq";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    array_push($lines, [
      "vsli_id"=>$values[0], 
      "vsli_seq"=>$values[1],
      "vsli_text"=>$values[2]
    ]);
  }
  return json_encode($lines);
}

function getEnglish($vish_code,$vsli_seq) {
  global $mysqli;

  $vish_code = $mysqli->real_escape_string($vish_code);
  $vsli_seq = $mysqli->real_escape_string($vsli_seq);
  
  $sql = 
    "select ifnull(vsli_text,'') from vsli ".
    "inner join vish using(vish_id) inner join vp_search.lang using(lang_id) ".
    "where lang_code = 'en' and vish_code = '".$vish_code."' and vsli_seq = $vsli_seq";
  $values = $mysqli->query($sql)->fetch_row();
  return json_encode(["english"=>$values[0]]);
}

function vshSubmit($sess_key,$creating,$lang_code,$vish) {
  global $mysqli;

  $vish_id = $mysqli->real_escape_string($vish->vish_id);
  $vish_code = $mysqli->real_escape_string($vish->vish_code);
  $lang_code = $mysqli->real_escape_string($lang_code);
  if (!vshPermission($sess_key,$creating,$vish_id,$lang_code)) {
    return '{"error":"Permission denied!"}';
  }
  
  $sql = "select lang_id from vp_search.lang where lang_code = '$lang_code'";
  $values = $mysqli->query($sql)->fetch_row();
  $lang_id = $values[0];
  
  /* validate code */
  $sql = "select 1 from vish where lang_id = $lang_id and vish_code = '$vish_code' and vish_id <> $vish_id";
  $result = $mysqli->query($sql);
  if ($result->num_rows) return '{"error":"This code already exists"}';
  
  if ($creating) {
    $sql = "insert into vish (lang_id,vish_code) values($lang_id,'$vish_code')";
    $mysqli->query($sql);
    $sql = "select vish_id from vish where lang_id = $lang_id and vish_code = '$vish_code'";
    $values = $mysqli->query($sql)->fetch_row();
    $vish_id = $values[0];
    if ($lang_code != "en") genLines($vish_id, $vish_code);
  }
  
  $vish_title = $mysqli->real_escape_string($vish->vish_title);
  $vish_ref = $mysqli->real_escape_string($vish->vish_ref);
  $vish_url = $mysqli->real_escape_string($vish->vish_url);
  $vish_date = $mysqli->real_escape_string($vish->vish_date);
  $sql = 
    "update vish set vish_code = '$vish_code', vish_title = '$vish_title', vish_ref = '$vish_ref', vish_url = '$vish_url', vish_date = '$vish_date' ".
    "where vish_id = $vish_id"; 
  $mysqli->query($sql);
  return '{"error":""}';
}

function vshDelete($sess_key,$vish_id) {
  global $mysqli;

  $vish_id = $mysqli->real_escape_string($vish_id);
  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 
  
  $sql = "delete from vish where vish_id = $vish_id";
  $mysqli->query($sql);
  return '{"error":""}';
}

function vshReady($sess_key,$vish_id,$vish_ready) {
  global $mysqli;

  $vish_id = $mysqli->real_escape_string($vish_id);
  $vish_ready = $mysqli->real_escape_string($vish_ready);
  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 
  
  $sql = "update vish set vish_ready = $vish_ready where vish_id = $vish_id";
  $mysqli->query($sql);
  return '{"error":""}';
}

function vshPermission ($sess_key,$creating,$vish_id,$lang_code) {
  global $mysqli;
  
  if (!$creating) {
    // get the real language code (parameter might be fraudulent)
    $vish_id = $mysqli->real_escape_string($vish_id);
    $sql = "select lang_code from vish inner join vp_search.lang using(lang_id) where vish_id = $vish_id";
    $values = $mysqli->query($sql)->fetch_row();
    $lang_code = $values[0];
  }
  $right = ($lang_code == "en" ? "videoshorts" : "edit");
  return hasPermission($sess_key,$right);
}

function genLines($vish_id, $vish_code) {
  global $mysqli;
  
  $vish_id = $mysqli->real_escape_string($vish_id);
  $vish_code = $mysqli->real_escape_string($vish_code);
  $sql = 
    "insert into vsli (vish_id, vsli_seq) ".
    "select $vish_id, vsli_seq from vsli ".
    "inner join vish using(vish_id) inner join vp_search.lang using(lang_id) ".
    "where vish_code = '".$vish_code."' and lang_code = 'en'";
  $mysqli->query($sql);
}

function vliSubmit($sess_key,$creating,$vsli) {
  global $mysqli;
  
  $vish_id = $mysqli->real_escape_string($vsli->vish_id);
  $vsli_id = $mysqli->real_escape_string($vsli->vsli_id);
  $vsli_seq = $mysqli->real_escape_string($vsli->vsli_seq);
  $vsli_text = $mysqli->real_escape_string($vsli->vsli_text);
  
  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 

  $mysqli->autocommit(false);
  $mysqli->begin_transaction();
  if ($creating) {
    $sql = "select lpad(ifnull(max(vsli_seq),0)+1,2,'0') from vsli where vish_id = $vish_id";
    $values = $mysqli->query($sql)->fetch_row();
    $vsli_seq = $values[0];
    $sql = "insert into vsli (vish_id,vsli_seq) values($vish_id,$vsli_seq)";
    $mysqli->query($sql);
    $sql = "select vsli_id from vsli where vish_id = $vish_id and vsli_seq = $vsli_seq";
    $values = $mysqli->query($sql)->fetch_row();
    $vsli_id = $values[0];
  }
  $sql = "update vsli set vsli_text = '$vsli_text' where vsli_id = $vsli_id";
  $mysqli->query($sql);
  $mysqli->commit();
  return '{"error":"", "vsli_seq":"'.$vsli_seq.'"}';
}

function vliDelete($sess_key,$vsli_id) {
  global $mysqli;

  $vsli_id = $mysqli->real_escape_string($vsli_id);
  $sql = "select vish_id, vsli_seq from vsli where vsli_id = $vsli_id";
  $values = $mysqli->query($sql)->fetch_row();
  $vish_id = $values[0];
  $vsli_seq = $values[1];
  
  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 
  
  $sql = "delete from vsli where vsli_id = $vsli_id";
  $mysqli->query($sql);
  $sql = "call vsli_reseq($vish_id,$vsli_seq)";
  $mysqli->query($sql);
  return '{"error":""}';
}

function vliSwap($sess_key,$vish_id,$seqA,$seqB) {
  global $mysqli;
  
  $vish_id = $mysqli->real_escape_string($vish_id);
  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 

  $seq_A = $mysqli->real_escape_string($seq_A);
  $seq_B = $mysqli->real_escape_string($seq_B);

  $mysqli->autocommit(false);
  $mysqli->begin_transaction();
  $sql = "update vsli set vsli_seq = 0 where vish_id = $vish_id and vsli_seq = $seqA";
  $mysqli->query($sql);
  $sql = "update vsli set vsli_seq = $seqA where vish_id = $vish_id and vsli_seq = $seqB";
  $mysqli->query($sql);
  $sql = "update vsli set vsli_seq = $seqB where vish_id = $vish_id and vsli_seq = 0";
  $mysqli->query($sql);
  $mysqli->commit();
  return '{"error":""}';
}

?>
