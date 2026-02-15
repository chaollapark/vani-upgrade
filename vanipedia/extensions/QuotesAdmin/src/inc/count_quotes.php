<?php

function countQuotes($sections,$method) {
  global $mysqli;

  $sql_1 =
    "select substr(content_address,4) rev_text_id from vaniquotes.vaniquotes_page ".
    "inner join vaniquotes.vaniquotes_slots on slot_revision_id = page_latest ".
    "inner join vaniquotes.vaniquotes_content on content_id = slot_content_id ".
    "where page_namespace = 0 ";
  $result = $mysqli->query($sql_1);
  while ($fields_1 = $result->fetch_row()) {
    $old_id = $fields_1[0];
    $sql_2 = "select old_text from vaniquotes.vaniquotes_text where old_id = $old_id";
    $fields_2 = $mysqli->query($sql_2)->fetch_row();
    $text = $fields_2[0];
    $regexp = "/{{totals_by_section.+?}}/";
    preg_match($regexp, $text, $matches);
    if ($matches) {
      $arr = explode("|", substr($matches[0],2,-2));
      for($i = 1; $i < count($arr); $i++) {
        $expr = explode("=", $arr[$i]);
        print_r($expr);
        $code = $expr[0]; $count = $expr[1];
        if (array_key_exists($code,$sections)) {
          $sections[$code] += $count;
        }
      }
    }
  }
  foreach($sections as $s => $v) {
    $sql_1 = "update vp_search.vquo set vquo_links = $v where vquo_code = '$s'";
    $mysqli->query($sql_1);
  }
  $sql_1 = "insert into vp_search.vqhi (vqhi_method) values('$method')";
  $mysqli->query($sql_1);
  return json_encode(["sections"=>$sections],JSON_NUMERIC_CHECK);
}

?>