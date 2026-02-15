<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

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
  
  $like = "%$right%";
  $sql = "select 1 from sess where sess_key = ? and sess_rights like ?";

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('ss', $sess_key, $like);
  $stmt->execute();
  $result = $stmt->get_result();
  
  return $result->num_rows;
}

function getLanguages() {
  global $mysqli;

  $sql = "select lang_code, lang_english from vp_search.lang where lang_show = 1 and lang_code <> 'en' order by lang_english";
  $result = $mysqli->query($sql);
  
  $languages = []; 
  while ($fields = $result->fetch_row()) {
    $languages[$fields[0]] = $fields[1];
  }
  return json_encode($languages,JSON_NUMERIC_CHECK);
}

function getTransCodes($lang_code) {
  global $mysqli;

  $lang_code = $mysqli->real_escape_string($lang_code);
  $sql = 
    "select vish_code, vish_code from vish A inner join vp_search.lang using(lang_id) ".
    "where vish_ready = 1 and lang_code = 'en' and not exists ".
    "(select 1 from vish B inner join vp_search.lang using(lang_id) ".
    " where lang_code = ? and A.vish_code = B.vish_code) ".
    "order by vish_code";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $lang_code);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $codes = []; 
  while ($fields = $result->fetch_row()) {
    $codes[$fields[0]] = $fields[1];
  }
  return json_encode($codes);
}

function getVideos($lang_code) {
  global $mysqli;

  $sql = 
    "select vish_id, vish_code, vish_title, vish_ref, vish_url, vish_date, vish_ready ".
    "from vish inner join vp_search.lang using(lang_id) where lang_code = ?";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $lang_code);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $videos = []; 
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

  $sql = "select vsli_id, lpad(vsli_seq,2,'0'), vsli_text from vsli where vish_id = ? order by vsli_seq";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('i', $vish_id);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $lines = []; 
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

  $sql = 
    "select ifnull(vsli_text,'') from vsli ".
    "inner join vish using(vish_id) inner join vp_search.lang using(lang_id) ".
    "where lang_code = 'en' and vish_code = ? and vsli_seq = ?";

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('si', $vish_code, $vsli_seq);
  $stmt->execute();
  $result = $stmt->get_result();

  $values = $result->fetch_row();
  return json_encode(["english"=>$values[0]]);
}

function vshSubmit($sess_key,$creating,$lang_code,$vish) {
  global $mysqli;

  if (!vshPermission($sess_key,$creating,$vish->vish_id,$lang_code)) {
    return '{"error":"Permission denied!"}';
  }
  
  $sql = "select lang_id from vp_search.lang where lang_code = ?";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $lang_code);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $values = $result->fetch_row();
  $lang_id = $values[0];
  
  /* validate code */
  $sql = "select 1 from vish where lang_id = ? and vish_code = ? and vish_id <> ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('isi',$lang_id,$vish->vish_code,$vish->vish_id);
  $stmt->execute();
  $result = $stmt->get_result();
  if ($result->num_rows) return '{"error":"This code already exists"}';
  
  $vish_id = $vish->vish_id;
  if ($creating) {
    $sql = "insert into vish (lang_id,vish_code) values(?,?)";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('is',$lang_id,$vish->vish_code);
    $stmt->execute();

    $sql = "select vish_id from vish where lang_id = ? and vish_code = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('is',$lang_id,$vish->vish_code);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $values = $result->fetch_row();
    $vish_id = $values[0];
    if ($lang_code != "en") genLines($vish->vish_id, $vish->vish_code);
  }
  
  $sql = "update vish set vish_code = ?, vish_title = ?, vish_ref = ?, vish_url = ?, vish_date = ? where vish_id = ?"; 
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('sssssi',$vish->vish_code,$vish->vish_title,$vish->vish_ref,$vish->vish_url,$vish->vish_date,$vish_id);
  $stmt->execute();

  return '{"error":""}';
}

function vshDelete($sess_key,$vish_id) {
  global $mysqli;

  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 
  
  $sql = "delete from vish where vish_id = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('i',$vish_id);
  $stmt->execute();

  return '{"error":""}';
}

function vshReady($sess_key,$vish_id,$vish_ready) {
  global $mysqli;

  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 
  
  $sql = "update vish set vish_ready = ? where vish_id = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('ii',$vish_ready,$vish_id);
  $stmt->execute();
  
  return '{"error":""}';
}

function vshPermission ($sess_key,$creating,$vish_id,$lang_code) {
  global $mysqli;
  
  if (!$creating) {
    // get the real language code (parameter might be fraudulent)
    $sql = "select lang_code from vish inner join vp_search.lang using(lang_id) where vish_id = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i',$vish_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $values = $result->fetch_row();
    $lang_code = $values[0];
  }
  $right = ($lang_code == "en" ? "videoshorts" : "edit");
  return hasPermission($sess_key,$right);
}

function genLines($vish_id, $vish_code) {
  global $mysqli;
  
  $sql = 
    "insert into vsli (vish_id, vsli_seq) ".
    "select ?, vsli_seq from vsli ".
    "inner join vish using(vish_id) inner join vp_search.lang using(lang_id) ".
    "where vish_code = ? and lang_code = 'en'";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('is',$vish_id,$vish_code);
  $stmt->execute();
}

function vliSubmit($sess_key,$creating,$vsli) {
  global $mysqli;
  
  if (!vshPermission($sess_key,false,$vsli->vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 

  $vsli_id = $vsli->vsli_id;
  $vsli_seq = $vsli->vsli_seq;
  $mysqli->begin_transaction();
  if ($creating) {
    $sql = "select lpad(ifnull(max(vsli_seq),0)+1,2,'0') from vsli where vish_id = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('i',$vsli->vish_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $values = $result->fetch_row();
    $vsli_seq = $values[0];
    $sql = "insert into vsli (vish_id,vsli_seq) values(?,?)";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('ii',$vsli->vish_id,$vsli_seq);
    $stmt->execute();

    $sql = "select vsli_id from vsli where vish_id = ? and vsli_seq = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('ii',$vsli->vish_id,$vsli_seq);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $values = $result->fetch_row();
    $vsli_id = $values[0];
  }
  $sql = "update vsli set vsli_text = ? where vsli_id = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('si',$vsli->vsli_text,$vsli_id);
  $stmt->execute();
  
  $mysqli->commit();
  return '{"error":"", "vsli_seq":"'.$vsli_seq.'"}';
}

function vliDelete($sess_key,$vsli_id) {
  global $mysqli;

  $sql = "select vish_id, vsli_seq from vsli where vsli_id = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('i',$vsli_id);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $values = $result->fetch_row();
  $vish_id = $values[0];
  $vsli_seq = $values[1];
  
  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 
  
  $sql = "delete from vsli where vsli_id = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('i',$vsli_id);
  $stmt->execute();
  
  $sql = "call vsli_reseq($vish_id,$vsli_seq)";
  $mysqli->query($sql);
  return '{"error":""}';
}

function vliSwap($sess_key,$vish_id,$seqA,$seqB) {
  global $mysqli;
  
  if (!vshPermission($sess_key,false,$vish_id,"")) {
    return '{"error":"Permission denied!"}';
  } 

  $mysqli->begin_transaction();
  $sql = "update vsli set vsli_seq = 0 where vish_id = ? and vsli_seq = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('ii',$vish_id,$seqA);
  $stmt->execute();
  
  $sql = "update vsli set vsli_seq = ? where vish_id = ? and vsli_seq = ?";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('iii',$seqA,$vish_id,$seqB);
  $stmt->execute();
  
  $sql = "update vsli set vsli_seq = ? where vish_id = ? and vsli_seq = 0";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('ii',$seqB,$vish_id);
  $stmt->execute();
  
  $mysqli->commit();
  return '{"error":""}';
}

?>
