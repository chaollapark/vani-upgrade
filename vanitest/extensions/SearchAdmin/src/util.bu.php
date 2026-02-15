<?php
include ("inc/db_connect.inc");

$func = @$_GET['func'];
if ($func == "get_master") {
  $view = @$_GET['view'];
  $vtyp_id = @$_GET['vtyp_id'];
  $catg_id = @$_GET['catg_id'];
  $filt = @$_GET['filt'];
  if ($view == "vani") $result = get_vanis($vtyp_id, $filt);
  else if ($view == "catg") $result = get_categories($catg_id, $filt);
} else if ($func == "get_vanitypes") {
  $result = get_vanitypes();
} else if ($func == "get_filt_pages") {
  $vani_id = @$_GET['vani_id'];
  $rpp = @$_GET['rpp'];
  $ofs = @$_GET['ofs'];
  $filt = @$_GET['filt'];
  $sort = json_decode(@$_GET['sort']);
  $result = get_filt_pages($vani_id, $rpp, $ofs, $filt, $sort);
} else if ($func == "page_count") {
  $vani_id = @$_GET['vani_id'];
  $filt = @$_GET['filt'];
  $result = page_count($vani_id, $filt);
} else if ($func == "ins_vanis") {
  $vtyp_id = @$_GET['vtyp_id'];
  $range = json_decode(@$_POST['range']);
  $result = ins_vanis($range, $vtyp_id);
} else if ($func == "del_vanis") {
  $range = json_decode(@$_POST['range']);
  $result = del_vanis($range);
} else if ($func == "lnk_vanis") {
  $range = json_decode(@$_POST['range']);
  $result = lnk_vanis($range);
} else if ($func == "get_catg_words") {
  $petl_id = @$_GET['petl_id'];
  $lang_id = @$_GET['lang_id'];
  $filt = @$_GET['filt'];
  $ofs = @$_GET['ofs'];
  $total = @$_GET['total'];
  $sort = @$_GET['sort'];
  $asc = @$_GET['asc'];
  $result = get_words(14, $petl_id, $lang_id, $filt, $ofs, $total, $sort, $asc);
} else if ($func == "get_page_words") {
  $petl_id = @$_GET['petl_id'];
  $lang_id = @$_GET['lang_id'];
  $filt = @$_GET['filt'];
  $ofs = @$_GET['ofs'];
  $total = @$_GET['total'];
  $sort = @$_GET['sort'];
  $asc = @$_GET['asc'];
  $result = get_words(0, $petl_id, $lang_id, $filt, $ofs, $total, $sort, $asc);
} else if ($func == "get_text_words") {
  $filt = @$_GET['filt'];
  $ofs = @$_GET['ofs'];
  $total = @$_GET['total'];
  $sort = @$_GET['sort'];
  $asc = @$_GET['asc'];
  $result = get_text_words($filt, $ofs, $total, $sort, $asc);
} else if ($func == "get_petals") {
  $result = get_petals();
} else if ($func == "get_languages") {
  $result = get_languages();
} else if ($func == "match_page_count") {
  $petal = @$_GET['petal'];
  $lang_id = @$_GET['lang_id'];
  $nspace = @$_GET['nspace'];
  $result = match_page_count($petal, $lang_id, $nspace);
} else if ($func == "gen_match_range") {
  $petal = @$_GET['petal'];
  $petl_id = @$_GET['petl_id'];
  $lang_id = @$_GET['lang_id'];
  $nspace = @$_GET['nspace'];
  $ofs = @$_GET['ofs'];
  $lim = @$_GET['lim'];
  $result = gen_match_range($petal, $petl_id, $lang_id, $nspace, $ofs, $lim);
} else if ($func == "get_dict_pages") {
  $petl_id = @$_GET['petl_id'];
  $lang_id = @$_GET['lang_id'];
  $filt = @$_GET['filt'];
  $ofs = @$_GET['ofs'];
  $total = @$_GET['total'];
  $sort = @$_GET['sort'];
  $asc = @$_GET['asc'];
  $diff = @$_GET['diff'];
  $result = get_dict_pages($petl_id, $lang_id, $filt, $ofs, $total, $sort, $asc, $diff);
} else if ($func == "set_diff_status") {
  $result = set_diff_status();
}  

echo $result;

function get_dict_pages($petl_id, $lang_id, $filt, $ofs, $total, $sort, $asc, $diff) {
  global $mysqli;

  $pages = []; 
  $filt = strtolower($mysqli->real_escape_string($filt));
  $tot_records = ($total ? $total : get_dict_pages_count($lang_id, $filt, $diff));
  $sortdir = ["asc","desc"][$asc];
  
  $sql = 
    "select p.page_id id, v.page_title title, p.page_status stat, l.lang_english lang, rev_timestamp rev_time, page_time pge_time ".
    "from page p ".
    "inner join vanisource.vanisource_page v using(page_id) ".
    "inner join vanisource.vanisource_revision r on r.rev_id = v.page_latest ".
    "inner join lang l on lang_code = v.page_lang ".
    "where 1=1 ".
    ($lang_id ? "and lang_id = $lang_id " : "").
    ($filt ? "and lower(convert(page_title using utf8mb4)) like '%$filt%' " : "").
    ($diff ? "and rev_timestamp <> page_time " : "").
    "order by $sort $sortdir ".
    "limit $ofs,100 ";
    //echo $sql;
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $title = $values[1]; $status = $values[2]; 
    $lang = $values[3]; $rev_time = $values[4]; $pge_time = $values[5];
    $pages[$id] = ["title" => $title, "stat" => (int)$status, "lang" => $lang, "rev_time" => $rev_time, "pge_time" => $pge_time]; 
  }
  $data = ["tot_records" => $tot_records, "pages" => $pages]; 
  return json_encode($data);
}

function get_dict_pages_count($lang_id, $filt, $diff) {
  global $mysqli;

  $sql =
    "select count(*) from page p ".
    "inner join vanisource.vanisource_page v using(page_id) ".
    "inner join vanisource.vanisource_revision r on r.rev_id = v.page_latest ".
    "inner join lang l on lang_code = v.page_lang ".
    "where 1=1 ".
    ($lang_id ? "and lang_id = $lang_id " : "").
    ($filt ? "and lower(convert(page_title using utf8mb4)) like '%$filt%' " : "").
    ($diff ? "and rev_timestamp <> page_time " : "");
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  return $values[0];
}

function set_diff_status() {
  global $mysqli;
  
  $sql = 
    "update page set page_status = 0 ".
    "where petl_id = 3 and page_id in (".
    "  select p.page_id from page p ".
    "  inner join vanisource.vanisource_page using(page_id) ".
    "  inner join vanisource.vanisource_revision on rev_id = page_latest ".
    "  where rev_timestamp <> page_time) ";
  $result = $mysqli->query($sql);
  return '{"status":"ok"}';
}

function get_words($nspace, $petl_id, $lang_id, $filt, $ofs, $total, $sort, $asc) {
  global $mysqli;

  $words = []; 
  $filt = strtolower($mysqli->real_escape_string($filt));
  $tot_records = ($total ? $total : get_word_count($nspace, $petl_id, $lang_id, $filt));
  $sortdir = ["asc","desc"][$asc];
  $sql = 
    "select concat(p.petl_id,'_',l.lang_id,'_',t.tokn_id), ".
    "tokn_text tokn, petl_name petl, lang_english lang, tkpt_freq freq from tokn t ".
    "inner join tkpt using(tokn_id) ".
    "inner join lang l using(lang_id) ".
    "inner join petl p using(petl_id) ".
    "where tkpt_nspace = $nspace ".
    ($petl_id ? "and petl_id = $petl_id " : "").
    ($lang_id ? "and lang_id = $lang_id " : "").
    ($filt ? "and lower(tokn_text) like '%$filt%' " : "").
    "order by $sort $sortdir ".
    "limit $ofs,100 ";
    //echo $sql;
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $tokn = $values[1]; 
    $petl = $values[2]; $lang = $values[3]; $freq = $values[4];
    $words[$id] = ["tokn" => $tokn, "petl" => $petl, "lang" => $lang, "freq" => $freq]; 
  }
  $data = ["tot_records" => $tot_records, "words" => $words]; 
  return json_encode($data);
}

function get_word_count($nspace, $petl_id, $lang_id, $filt) {
  global $mysqli;

  $sql = 
    "select count(*) from tokn ".
    "inner join tkpt using(tokn_id) ".
    "inner join lang using(lang_id) ".
    "inner join petl using(petl_id) ".
    "where tkpt_nspace = $nspace ".
    ($petl_id ? "and petl_id = $petl_id " : "").
    ($lang_id ? "and lang_id = $lang_id " : "").
    ($filt ? "and tokn_text like '%$filt%' " : "");
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  return $values[0];
}

function get_text_words($filt, $ofs, $total, $sort, $asc) {
  global $mysqli;

  $words = []; 
  $filt = strtolower($mysqli->real_escape_string($filt));
  $tot_records = ($total ? $total : get_text_word_count($filt));
  $sortdir = ["asc","desc"][$asc];
  $sql = 
    "select concat('3_100_',d.dict_id), dict_text2 tokn, 'vanisource' petl, 'English' lang, dict_freq freq from dict d ".
    "where dict_search = 1 ".
    ($filt ? "and dict_text2 like '%$filt%' " : "").
    "order by $sort $sortdir ".
    "limit $ofs,100 ";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $tokn = $values[1]; 
    $petl = $values[2]; $lang = $values[3]; $freq = $values[4];
    $words[$id] = ["tokn" => $tokn, "petl" => $petl, "lang" => $lang, "freq" => $freq]; 
  }
  $data = ["tot_records" => $tot_records, "words" => $words]; 
  return json_encode($data);
}

function get_text_word_count($filt) {
  global $mysqli;

  $sql = 
    "select count(*) from dict ".
    "where dict_search = 1 ".
    ($filt ? "and dict_text2 like '%$filt%' " : "");
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  return $values[0];
}

function get_vanis($vtyp_id, $filt) {
  global $mysqli;

  $vanis = []; 
  $filt = strtolower($mysqli->real_escape_string($filt));
  $sql = 
    "select vani_id, vani_code, vani_name, ".
    "  (select count(*) from vnpg b where b.vani_id = a.vani_id) tot_pages ".
    "from vani a ".
    "where vtyp_id = $vtyp_id ".
    ($filt ? "and lower(vani_name) like '%$filt%' " : "")."order by vani_name ";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $code = $values[1]; $name = $values[2]; $tot_pages = $values[3];
    $vanis[$id] = [
      "code" => $code, 
      "name" => $name, 
      "tot_pages" => $tot_pages
    ]; 
  }
  return json_encode($vanis);
}

function get_vanitypes() {
  global $mysqli;

  $vanitypes = []; 
  $sql = "select vtyp_id, vtyp_name, catg_id from vtyp ";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $name = $values[1]; $catg_id = $values[2]; 
    $vanitypes[$id] = ["name" => $name, "catg_id" => $catg_id]; 
  }
  return json_encode($vanitypes);
}

function get_petals() {
  global $mysqli;

  $petals = []; 
  $sql = "select petl_id, petl_name from petl order by petl_id ";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $name = $values[1];
    $petals[$id] = ["name" => $name]; 
  }
  return json_encode($petals);
}

function get_languages() {
  global $mysqli;

  $languages = []; 
  $sql = "select lang_id, lang_english from lang where lang_show = 1 order by lang_name";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; $name = $values[1];
    $languages[$id] = ["name" => $name]; 
  }
  return json_encode($languages);
}

function get_filt_pages($vani_id, $rpp, $ofs, $filt, $sort) {
  global $mysqli;

  $pages = []; 
  $filt = strtolower($mysqli->real_escape_string($filt));
  $order = 
    "order by $sort->type ".["asc","desc"][$sort->sort]." limit $ofs, $rpp ";
  $sql = 
    "select v.page_id id, s.page_title name from vnpg v ".
    "inner join vanisource.vanisource_page s using(page_id) ".
    "where v.vani_id = $vani_id ".
    ($filt ? "and lower(s.page_title) like '%$filt%' " : "").$order;
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; 
    $title = str_replace("_"," ",$values[1]);
    $pages[$id] = [
      "title" => $title
    ]; 
  }
  return json_encode($pages);
}

function get_categories($catg_id, $filt) {
  global $mysqli;

  $sql = "select cat_title from vanisource.vanisource_category where cat_id = $catg_id ";
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  $catg_name = $mysqli->real_escape_string($values[0]);

  $categories = []; 
  $filt = strtolower($mysqli->real_escape_string($filt));
  $sql = 
    "select f.page_id, f.page_title, cl_type ".
    "from vanisource.vanisource_category t ".
    "inner join vanisource.vanisource_categorylinks on cl_to = t.cat_title ".
    "inner join vanisource.vanisource_page f on f.page_id = cl_from ".
    "left join vani on vani.page_id = f.page_id ".
    "where t.cat_title = '$catg_name' ".
    ($filt ? "and lower(f.page_title) like '%$filt%' " : "").
    "and vani_id is null ".
    "order by f.page_title";
  $result = $mysqli->query($sql);
  while ($values = $result->fetch_row()) {
    $id = $values[0]; 
    $name = str_replace("_"," ",$values[1]);
    $type = $values[2];
    $categories[$id] = [
      "name" => $name, 
      "type" => $type
    ];
  }
  return json_encode($categories);
}

function page_count($vani_id, $filt) {
  global $mysqli;
  
  $filt = strtolower($mysqli->real_escape_string($filt));
  $sql = 
    "select count(*) from vnpg ".
    ($filt ? "inner join vanisource.vanisource_page using(page_id) " : "").
    "where vani_id = $vani_id ".
    ($filt ? "and lower(page_title) like '%$filt%' " : "");

  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  return json_encode($values[0]);
}

function ins_vanis($range, $vtyp_id) {
  global $mysqli;

  $sql1 = "insert into vani (vtyp_id, page_id, vani_name) values ";
  foreach ($range as $idx => $page_id) {
    /* TODO: validate if already present */
    $sql2 = 
      "select page_title from vanisource.vanisource_page where page_id = $page_id ";
    $result = $mysqli->query($sql2);
    $values = $result->fetch_row();
    $name = str_replace("_"," ",$mysqli->real_escape_string($values[0]));
    $sql1 .= "($vtyp_id, $page_id, '$name')";
    if ($idx != array_key_last($range)) $sql1 .= ",";
  }
  $result = $mysqli->query($sql1);
  return '{"status":"ok"}';
}

function del_vanis($range) {
  global $mysqli;
  
  $sql = "delete from vani where vani_id in (".implode(",", $range).")";
  $result = $mysqli->query($sql);
  return '{"status":"ok"}';
}

function lnk_vanis($range) {
  global $mysqli;

  foreach ($range as $vani_id) {
    $sql = "select page_id from vani where vani_id = $vani_id ";
    $result = $mysqli->query($sql);
    $values = $result->fetch_row();
    $page_id = $values[0];
    
  /* TODO: transaction ? */
    $sql = "delete from vnpg where vani_id = $vani_id ";
    $mysqli->query($sql);

    lnk_one_vani($vani_id, $page_id,[]);
  }
  return '{"status":"ok"}';
}

function lnk_one_vani($vani_id, $page_id, $sofar) {
  global $mysqli;

  $sql = "select page_namespace, page_title from vanisource.vanisource_page where page_id = $page_id ";
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  $namespace = $values[0]; 
  if ($namespace != 14) {
    $sql = "insert into vnpg(vani_id,page_id) values($vani_id,$page_id) "; /* TODO: make page if not exists */
    $mysqli->query($sql);
  } else {
    $title = $mysqli->real_escape_string($values[1]);
    $sql = "select cl_from from vanisource.vanisource_categorylinks where cl_to = '$title'";
    $result = $mysqli->query($sql);
    while ($values = $result->fetch_row()) {
      $cl_from = $values[0];
      if (!in_array($cl_from, $sofar)) {
        array_push($sofar, $cl_from);
        lnk_one_vani($vani_id, $cl_from, $sofar);
      }
    }
  }
}

function match_page_count($petal, $lang_id, $nspace) {
  global $mysqli;
  $sql = 
    "select count(*) from $petal.$petal"."_page ".
    ($lang_id == 0 ? "" : 
      "inner join lang on lang_id = $lang_id and lang_code = $petal.$petal"."_page.page_lang ").
    "where $petal.$petal"."_page.page_namespace = $nspace ";
  $result = $mysqli->query($sql);
  $values = $result->fetch_row();
  return json_encode($values[0]);
}

function gen_match_range($petal, $petl_id, $lang_id, $nspace, $ofs, $lim) {
  global $mysqli;
  
  $sql = "call gen_match_tokn('$petal', $petl_id, $lang_id, $nspace, $ofs, $lim)";
  $mysqli->query($sql);
  return '{"status":"ok"}';
}

?>