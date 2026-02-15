<?php

function do_refresh($mysqli) {
// add new locations to the translation table
  $sql = 
    "select * from ".
    " (select cat_title, trim(substring(replace(page_title,'_',' '), locate('-', page_title) + 1)) loca ".
    "  from vanipedia.vanipedia_categorylinks ".
    "  inner join vanipedia.vanipedia_page on page_id = cl_from ".
    "  inner join vanipedia.vanipedia_category on cat_title = page_title ".
    "  where cl_to = 'Nectar_Drops_from_Srila_Prabhupada' ".
    "  and cl_type = 'subcat' ".
    "  and page_title like 'Nectar_Drops%') q ".
    "where loca not like '19%' ";
  
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_array()) {
    $loca = $fields[1];
    $sql = 
      "select ifnull(max(1),0) ".
      "from vp_translate.tran ".
      "where tran_catg = 2 and tran_lang = 'en' ".
      "and tran_code = '$loca' ";

    $result2 = $mysqli->query($sql);
    $fields2 = $result2->fetch_array();
    $exists = $fields2[0];
    if (!$exists) do_insert ($mysqli, $loca);
  }
}

function do_insert ($mysqli, $loca) {
  // determine the next primary key number
  $sql = "select max(tran_id) from vp_translate.tran";
  $result = $mysqli->query($sql);
  $fields = $result->fetch_array();
  $tran_id = $fields[0] + 1;

  // insert the new record
  $sql =
    "insert into vp_translate.tran (tran_id, tran_catg, tran_lang, tran_code) ".
    "values($tran_id, 2, 'en', '$loca')";
  $mysqli->query($sql);  
}

?>