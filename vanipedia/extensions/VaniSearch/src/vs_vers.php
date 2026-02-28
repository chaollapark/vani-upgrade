<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include ("inc/db_connect.inc");
include ("./../util/slog.php");

$bind_params = []; $bind_types = '';

$func = @$_GET['func'];
$params = json_decode(@$_POST['params']);
if ($func == "nav_line") {
  log_search ("line", $params->target, $params->op, $params->ww, $params->ds, 0, 0, 1, "en");
  $result = get_nav_line($params);
} else if ($func == "line") {
  $ofs = @$_GET['ofs'];
  $lim = @$_GET['lim'];
  $page = @$_GET['page'];
  $result = get_line($ofs, $lim, $page, $params);
} else if ($func == "nav_syno") {
  log_search ("syno", $params->sea_orig, $params->op_orig, $params->ww_orig, $params->ds, 0, 0, 1, "en");
  $result = get_nav_syno($params);
} else if ($func == "syno") {
  $ofs = @$_GET['ofs'];
  $lim = @$_GET['lim'];
  $page = @$_GET['page'];
  $result = get_syno($ofs, $lim, $page, $params);
} else if ($func == "nav_trns") {
  log_search ("trns", $params->target, $params->op, $params->ww, $params->ds, 0, 0, 1, "en");
  $result = get_nav_trns($params);
} else if ($func == "trns") {
  $ofs = @$_GET['ofs'];
  $lim = @$_GET['lim'];
  $page = @$_GET['page'];
  $result = get_trns($ofs, $lim, $page, $params);
}
echo $result; return;

function sort_ok($sort) {
  return in_array($sort, ['vers']);
}

function debug_txt ($txt) {
  global $mysqli;
  $txt = $mysqli->real_escape_string($txt);
  $sql = "insert into dbug (dbug_text) values ('$txt')";
  $mysqli->query($sql);
}

function get_nav_line($params) {
  global $mysqli, $bind_params, $bind_types;
  
  if (!$params->target) return "";
  if (!sort_ok($params->sort)) return 0; /* prevent SQL injection */
  if (filter_var_array([$params->book, $params->part, $params->chap], FILTER_VALIDATE_INT) === false) return 0; /* prevent SQL injection */
  
  $json = [];
  $target = preg_replace("/\s+/", " ",$params->target);
  //$order = ($sort == "vers" ? "vers_id, line_id" : "line_text_bare");
  $order = $params->sort.[" asc"," desc"][$params->dir]; // todo
  $collate = ($params->ds ? "utf8mb4_bin" : ""); // the default for the LINE table is utf8mb4_unicode_ci
  $where = gen_html_where("line_text", $target, $params->op, $collate);
  if (!$params->book) {
    $join = "";
  } else {
    $join = "INNER JOIN vers v USING (vers_id) LEFT JOIN chap USING (chap_id) ";
    $where = 
      "(v.book_id = $params->book) ".
      ($params->part ? "AND (part_id = $params->part) " : "") .
      ($params->chap ? "AND (chap_id = $params->chap) " : "") .
      "AND ".$where;
  }
  
  regexp_translit_prepare ($params->ds,$params->op,$target,$transliterator,$tl_target,$beg,$end,$words);
  $sql = "SELECT line_text orig, min(l.vers_ref) vers FROM line l $join WHERE $where group by line_text order by $order";

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($bind_types, ...$bind_params);
  $stmt->execute();
  $result = $stmt->get_result();
  $num_rows = $result->num_rows; 
  $num_hits = 0; $idx = 0; $ofs = -1;
  while ($values = $result->fetch_row()) {
    $idx++;
    $raw_text = $values[0];
    $line = ($params->ds ? $raw_text : $transliterator->transliterate($raw_text));
    $hit = ($params->ww ? regexp_translit_match ($tl_target,$line,$params->op,$beg,$end,$words) : 1);
    if ($hit) $num_hits++;
    if ($ofs < 0) $ofs = $idx - 1;
    if (($idx == $num_rows) || ($hit && ($num_hits % $params->rpp == 0))) {
      $lim = $idx - $ofs;
      array_push($json, [$ofs,$lim]);
      $ofs = -1;
    }
  }
  $tot_pages = (int) ($num_hits / $params->rpp) + ($num_hits % $params->rpp ? 1 : 0);
  return json_encode(["tot_records" => $num_hits, "tot_pages" => $tot_pages, "json" => $json]);
}

function get_line($ofs, $lim, $page, $params) { /* different approach for preventing SQL injection: just test if the $params are integers */
  global $mysqli, $bind_params, $bind_types;

  if (!$params->target) return "";
  if (!sort_ok($params->sort)) return 0; /* prevent SQL injection */
  if (filter_var_array([$params->book, $params->part, $params->chap], FILTER_VALIDATE_INT) === false) return 0; /* prevent SQL injection */

  $target = preg_replace("/\s+/", " ",$params->target);
  //$order = ($sort == "vers" ? "vers_id, line_id" : "line_text_bare");
  $order = $params->sort.[" asc"," desc"][$params->dir]; // todo
  $collate = ($params->ds ? "utf8mb4_bin" : ""); // the default for the LINE table is utf8mb4_unicode_ci
  $where = gen_html_where("line_text", $target, $params->op, $collate);
  if (!$params->book) {
    $join = "";
  } else {
    $join = "INNER JOIN vers v USING (vers_id) LEFT JOIN chap USING (chap_id) ";
    $where = 
      "(v.book_id = $params->book) ".
      ($params->part ? "AND (part_id = $params->part) " : "") .
      ($params->chap ? "AND (chap_id = $params->chap) " : "") .
      "AND ".$where;
  }

  regexp_translit_prepare ($params->ds,$params->op,$target,$transliterator,$tl_target,$beg,$end,$words);
  
  $sql = "SELECT line_text orig, min(l.vers_ref) vers FROM line l $join WHERE $where group by line_text order by $order LIMIT ?,? ";
  $bind_params[] = $ofs; $bind_types .= 'i'; $bind_params[] = $lim; $bind_types .= 'i';
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($bind_types, ...$bind_params);
  $stmt->execute();
  $result = $stmt->get_result();
  $table = "";
  $idx = ($page - 1) * $params->rpp + 1;
  while ($values = $result->fetch_row()) {
    $raw_text = $values[0];
    $line = ($params->ds ? $raw_text : $transliterator->transliterate($raw_text));
    $hit = ($params->ww ? regexp_translit_match ($tl_target,$line,$params->op,$beg,$end,$words) : 1);
    if (!$hit) continue;
    //$esc_text = $mysqli->real_escape_string($raw_text);
    $sql_2 =
      "SELECT DISTINCT l.vers_ref, v.vers_url ".
      "FROM line l INNER JOIN vers v USING (vers_id) LEFT JOIN chap USING (chap_id) ".
      "WHERE ".($params->book ? "(v.book_id = $params->book) AND " : "").
      ($params->part ? "(part_id = $params->part) AND ": "").
      ($params->chap ? "(chap_id = $params->chap) AND ": "").
      "line_text = '$raw_text' ". // maybe compare with utf8mb4_bin collation? (separate field?)
      "ORDER BY l.vers_ref ";
    $refs = "";
    $result_2 = $mysqli->query($sql_2);
    while ($fields_2 = $result_2->fetch_row()) {
      $refs .= ", ".get_href(trim($fields_2[0]), $fields_2[1]);
    }
    $raw_text = highlight($raw_text, $target, $params->op, $params->ww, $params->ds);
    $table .=
      '<tr><td class="td_num">'.$idx.'</td><td class="limit_750">' .
      $raw_text . '</td><td>' . substr($refs,1) . '</td></tr>' . "\r\n";
    $idx++;
  }

  $header =
    '  <tr>'."\r\n".
    '    <th>#</th>'."\r\n".
    '    <th id="line_orig" class="sortable">Sanskrit or Bengali</th>'."\r\n".
    '    <th id="line_vers" class="sortable">Verse Reference</th>'."\r\n".
    '  </tr>';

  return
    '  <table class="search_result" border=1>'."\r\n".
    '  <tbody>'."\r\n".
    $header.
    $table.
    '  </tbody>'."\r\n".
    '  </table>'."\r\n";
}

function get_nav_trns($params) {
  global $mysqli, $bind_params, $bind_types;

  if (!$params->target) return "";
  if (!sort_ok($params->sort)) return 0; /* prevent SQL injection */
  if (filter_var_array([$params->book], FILTER_VALIDATE_INT) === false) return 0; /* prevent SQL injection */
  
  $json = [];
  $target = preg_replace("/\s+/", " ",$params->target);
  //$order = ($sort == "vers" ? "vers_id, line_id" : "line_text_bare");
  $order = $params->sort.[" asc"," desc"][$params->dir]; // todo
  $collate = ($params->ds ? "utf8mb4_bin" : ""); // the default for the LINE table is utf8mb4_unicode_ci
  $where = gen_html_where("tran_text", $target, $params->op, $collate);
  if ($params->book) {
    $where = "(book_id = $params->book) AND ".$where;
  }

  regexp_translit_prepare ($params->ds,$params->op,$target,$transliterator,$tl_target,$beg,$end,$words);
  $sql = "SELECT tran_text tran, vers_ref vers FROM tran INNER JOIN vers using(vers_id) WHERE $where order by $order";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($bind_types, ...$bind_params);
  $stmt->execute();
  $result = $stmt->get_result();
  $num_rows = $result->num_rows;
  $num_hits = 0; $idx = 0; $ofs = -1;
  while ($values = $result->fetch_row()) {
    $idx++;
    $raw_text = $values[0];
    $line = ($params->ds ? $raw_text : $transliterator->transliterate($raw_text));
    $hit = ($params->ww ? regexp_translit_match ($tl_target,$line,$params->op,$beg,$end,$words) : 1);
    if ($hit) $num_hits++;
    if ($ofs < 0) $ofs = $idx - 1;
    if (($idx == $num_rows) || ($hit && ($num_hits % $params->rpp == 0))) {
      $lim = $idx - $ofs;
      array_push($json, [$ofs,$lim]);
      $ofs = -1;
    }
  }
  $tot_pages = (int) ($num_hits / $params->rpp) + ($num_hits % $params->rpp ? 1 : 0);
  return json_encode(["tot_records" => $num_hits, "tot_pages" => $tot_pages, "json" => $json]);
}

function get_trns($ofs, $lim, $page, $params) {
  global $mysqli, $bind_params, $bind_types;
  
  if (!$params->target) return "";
  
  $target = $mysqli->real_escape_string($params->target);
  $target = preg_replace("/\s+/", " ",$target);

  //$order = ($sort == "vers" ? "vers_id, line_id" : "line_text_bare");
  $order = $params->sort.[" asc"," desc"][$params->dir]; // todo
  $collate = ($params->ds ? "utf8mb4_bin" : ""); // the default for the LINE table is utf8mb4_unicode_ci
  $where = gen_html_where("tran_text", $target, $params->op, $collate);
  if ($params->book) {
    $where = "(book_id = $params->book) AND ".$where;
  }
  
  regexp_translit_prepare ($params->ds,$params->op,$target,$transliterator,$tl_target,$beg,$end,$words);
  $sql = "SELECT tran_text tran, vers_ref vers, vers_url FROM tran INNER JOIN vers USING(vers_id) WHERE $where order by $order LIMIT ?,? ";
  $bind_params[] = $ofs; $bind_types .= 'i'; $bind_params[] = $lim; $bind_types .= 'i';
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($bind_types, ...$bind_params);
  $stmt->execute();
  $result = $stmt->get_result();
  $table = "";
  $idx = ($page - 1) * $params->rpp + 1;
  while ($values = $result->fetch_row()) {
    $raw_text = $values[0];
    $line = ($params->ds ? $raw_text : $transliterator->transliterate($raw_text));
    $hit = ($params->ww ? regexp_translit_match ($tl_target,$line,$params->op,$beg,$end,$words) : 1);
    if (!$hit) continue;

    $href = get_href(trim($values[1]), $values[2]);
    $raw_text = highlight($raw_text, $target, $params->op, $params->ww, $params->ds);
    $table .=
      '<tr><td class="td_num">'.$idx.'</td><td class="limit_750">' .
      $raw_text . '</td><td>' . $href . '</td></tr>' . "\r\n";
    $idx++;
  }

  $header =
    '  <tr>'."\r\n".
    '    <th>#</th>'."\r\n".
    '    <th id="trns_tran" class="sortable">Translation</th>'."\r\n".
    '    <th id="trns_vers" class="sortable">Verse Reference</th>'."\r\n".
    '  </tr>';

  return
    '  <table class="search_result" border=1>'."\r\n".
    '  <tbody>'."\r\n".
    $header.
    $table.
    '  </tbody>'."\r\n".
    '  </table>'."\r\n";
}

function regexp_translit_prepare ($ds,$op,$target,&$transliterator,&$tl_target,&$beg,&$end,&$words) {
  if ($ds) $tl_target = $target; 
  else {
    $rules = ":: Any-Latin; :: Latin-ASCII; :: NFD; :: [:Nonspacing Mark:] Remove; :: Lower(); :: NFC;";
    $transliterator = Transliterator::createFromRules($rules, Transliterator::FORWARD);
    $tl_target = $transliterator->transliterate($target);
  }
  $beg = (($op == "starts") || ($op == "starts_any") ? '^' : '');
  $end = (($op == "ends") || ($op == "ends_any") ? '$' : '');
  if (($op == "contains_any") || ($op == "starts_any") || ($op == "ends_any"))
    $tl_target = implode("|",explode(" ", str_replace("-"," ",$tl_target)));
  if ($op == "contains_all") {
    $words = explode(" ", str_replace("-"," ",$tl_target));
//    $tl_target = implode(')\b|\b(', $words);
    $tl_target = implode('|', $words);
  }
}

function regexp_translit_match ($target,$line,$op,$beg,$end,$words) {
  switch (true) {
    case (($op == "contains") || ($op == "starts") || ($op == "ends")):
      $pattern = '/'.$beg.'\b('.$target.')\b'.$end.'/u';
      return preg_match_all($pattern, $line, $matches);
    case (($op == "contains_any") || ($op == "starts_any") || ($op == "ends_any")):
      $pattern = '/'.$beg.'\b('.$target.')\b'.$end.'/u';
      return preg_match_all($pattern, $line, $matches);
    case ($op == "contains_all"):
      $pattern = '/'.$beg.'\b('.$target.')\b'.$end.'/u';
      preg_match_all($pattern, $line, $matches);
      return !sizeof(array_diff($words, $matches[0]));
    default: return 1;
  }
}

function highlight($text, $target, $op, $ww, $ds) {
  if (($op == "shorter_than") || ($op == "longer_than")) return $text;
//  $ds = ($ds == "true"); $ww = ($ww == "true");
  $text2 = $text;
  if (!$ds) {
    $rules = ":: Any-Latin; :: Latin-ASCII; :: NFD; :: [:Nonspacing Mark:] Remove; :: Lower(); :: NFC;";
    $transliterator = Transliterator::createFromRules($rules, Transliterator::FORWARD);
    $text2 = $transliterator->transliterate($text);
    $target = $transliterator->transliterate($target);
  }
  $st = (($op == "starts") || ($op == "starts_any") ? '^' : ''); /* starts */
  $en = (($op == "ends") || ($op == "ends_any") ? '$' : ''); /* ends */
  $wb = ($ww ? '\b' : ''); /* word boundary */
  $target = (
    ($op == "contains") || ($op == "starts") || ($op == "ends") || ($op == "equals") ?
    $target :
    implode("|",explode(" ", str_replace("-"," ",$target)))
  );
  $pattern = '/'.$st.$wb.'('.$target.')'.$wb.$en.'/u';
  preg_match_all($pattern, $text2, $matches, PREG_OFFSET_CAPTURE);
  $ofs = 0;
  for ($t = 0; $t < sizeof($matches[0]); $t++) {
    $str = $matches[0][$t][0]; /* NB! preg_match_all result */
    $cpos = $matches[0][$t][1];
    $len = ($ds ? strlen($str) : mb_strlen($str));
    $text =
      ($ds ? substr($text,0,$ofs + $cpos) : mb_substr($text,0,$ofs + $cpos))."<span class='mark'>".
      ($ds ? substr($text,$ofs + $cpos,$len) : mb_substr($text,$ofs + $cpos,$len))."</span>".
      ($ds ? substr($text,$ofs + $cpos + $len) : mb_substr($text,$ofs + $cpos + $len));
    $ofs += 26;
  }
  return $text;
}

function get_nav_syno($params) {
  global $mysqli, $bind_params, $bind_types;
  
  $hierarchy = ["book"=>[],"chap"=>[],"part"=>[]];
  if (!$params->sea_orig && !$params->sea_tran) return "";
  if (!sort_ok($params->sort)) return 0; /* prevent SQL injection */
  if (filter_var_array([$params->book, $params->part, $params->chap], FILTER_VALIDATE_INT) === false) return 0; /* prevent SQL injection */
  
  $json = []; $sea_orig = ""; $sea_tran = "";
  $sql_1 = syno_sql_1 ($sea_orig, $sea_tran, 0, 0, $params);
  
  if ($sea_orig) regexp_translit_prepare ($params->ds,$params->op_orig,$sea_orig,$transliterator,$tl_sea_orig,$beg_o,$end_o,$words_o);
  if ($sea_tran) regexp_translit_prepare ($params->ds,$params->op_tran,$sea_tran,$transliterator,$tl_sea_tran,$beg_t,$end_t,$words_t);
  
  $stmt = $mysqli->prepare($sql_1);
  $stmt->bind_param($bind_types, ...$bind_params);
  $stmt->execute();
  $result = $stmt->get_result();

  $num_rows = $result->num_rows;
  $num_hits = 0; $idx = 0; $ofs = -1;
  while ($values = $result->fetch_row()) {
    $idx++;
    $raw_orig = $values[0]; $raw_tran = $values[1]; 
    $syno_orig = ($params->ds ? $raw_orig : $transliterator->transliterate($raw_orig));
    $syno_tran = ($params->ds ? $raw_tran : $transliterator->transliterate($raw_tran));
    $hit_o = (!$sea_orig || ($params->ww_orig ? regexp_translit_match ($tl_sea_orig,$syno_orig,$params->op_orig,$beg_o,$end_o,$words_o) : 1));
    $hit_t = (!$sea_tran || ($params->ww_tran ? regexp_translit_match ($tl_sea_tran,$syno_tran,$params->op_tran,$beg_t,$end_t,$words_t) : 1));
    $hit = ($hit_o && $hit_t);
    if ($hit) $num_hits++;
    if ($ofs < 0) $ofs = $idx - 1;
    if (($idx == $num_rows) || ($hit && ($num_hits % $params->rpp == 0))) {
      $lim = $idx - $ofs;
      array_push($json, [$ofs,$lim]);
      $ofs = -1;
    }
    if (!$hit) continue;
    
    /* SQL that performs the counting of actual matches and returns the hierarchy array */
    $bind_params = []; $bind_types = '';
    $sql_2 = syno_sql_2 ($raw_orig,$raw_tran,$params);
    $stmt = $mysqli->prepare($sql_2);
    $stmt->bind_param($bind_types, ...$bind_params);
    $stmt->execute();
    $result_2 = $stmt->get_result();
    while ($fields_2 = $result_2->fetch_array()) {
      $book_id = $fields_2[2]; $chap_id = $fields_2[3]; $part_id = $fields_2[4];
      $hierarchy["book"][$book_id] = (array_key_exists($book_id, $hierarchy["book"]) ? $hierarchy["book"][$book_id]+1 : 1);
      if ($chap_id) $hierarchy["chap"][$chap_id] = (array_key_exists($chap_id, $hierarchy["chap"]) ? $hierarchy["chap"][$chap_id]+1 : 1);
      if ($part_id) $hierarchy["part"][$part_id] = (array_key_exists($part_id, $hierarchy["part"]) ? $hierarchy["part"][$part_id]+1 : 1);
    }
    /**/
  }
  $tot_pages = (int) ($num_hits / $params->rpp) + ($num_hits % $params->rpp ? 1 : 0);
  return json_encode(["tot_records" => $num_hits, "tot_pages" => $tot_pages, "json" => $json, "hierarchy" => $hierarchy]);
}

function get_syno($ofs, $lim, $page, $params) {
  global $mysqli, $bind_params, $bind_types;
  
  if (!$params->sea_orig && !$params->sea_tran) return "";
  if (!sort_ok($params->sort)) return 0; /* prevent SQL injection */
  if (filter_var_array([$params->book, $params->part, $params->chap], FILTER_VALIDATE_INT) === false) return 0; /* prevent SQL injection */
  
  $sea_orig = ""; $sea_tran = "";
  $sql_1 = syno_sql_1 ($sea_orig, $sea_tran, $ofs, $lim, $params);

  if ($sea_orig) regexp_translit_prepare ($params->ds,$params->op_orig,$sea_orig,$transliterator,$tl_sea_orig,$beg_o,$end_o,$words_o);
  if ($sea_tran) regexp_translit_prepare ($params->ds,$params->op_tran,$sea_tran,$transliterator,$tl_sea_tran,$beg_t,$end_t,$words_t);

  $stmt = $mysqli->prepare($sql_1);
  $stmt->bind_param($bind_types, ...$bind_params);
  $stmt->execute();
  $result_1 = $stmt->get_result();
  
  $table = "";
  $idx = ($page - 1) * $params->rpp + 1;
  while ($fields_1 = $result_1->fetch_row()) {
    $raw_orig = $fields_1[0]; $raw_tran = $fields_1[1];
    $syno_orig = ($params->ds ? $raw_orig : $transliterator->transliterate($raw_orig));
    $syno_tran = ($params->ds ? $raw_tran : $transliterator->transliterate($raw_tran));
    $hit_o = (!$sea_orig || ($params->ww_orig ? regexp_translit_match ($tl_sea_orig,$syno_orig,$params->op_orig,$beg_o,$end_o,$words_o) : 1));
    $hit_t = (!$sea_tran || ($params->ww_tran ? regexp_translit_match ($tl_sea_tran,$syno_tran,$params->op_tran,$beg_t,$end_t,$words_t) : 1));
    $hit = ($hit_o && $hit_t);    
    if (!$hit) continue;
    
    $bind_params = []; $bind_types = '';
    $sql_2 = syno_sql_2 ($raw_orig,$raw_tran,$params);
    $refs = "";
    $stmt = $mysqli->prepare($sql_2);
    $stmt->bind_param($bind_types, ...$bind_params);
    $stmt->execute();
    $result_2 = $stmt->get_result();
    while ($fields_2 = $result_2->fetch_array()) {
      $refs .= ", ".get_href(trim($fields_2[0]), $fields_2[1]);
    }
    $raw_orig = highlight($raw_orig, $sea_orig, $params->op_orig, $params->ww_orig, $params->ds);
    $raw_tran = highlight($raw_tran, $sea_tran, $params->op_tran, $params->ww_tran, $params->ds);
    $table .=
      '<tr><td class="td_right">'.$idx.'</td><td>' . $raw_orig . '</td><td class="limit_250">' .
      $raw_tran . '</td><td class="limit_500">' . substr($refs,1) . '</td></tr>' . "\r\n";
    $idx += 1;
  }

  $header =
    '  <tr>'."\r\n".
    '    <th>#</th>'."\r\n".
    '    <th id="syno_orig" class="sortable">Sanskrit or Bengali</th>'."\r\n".
    '    <th id="syno_tran" class="sortable">English</th>'."\r\n".
    '    <th id="syno_vers" class="sortable">Verse Reference</th>'."\r\n".
    '  </tr>';

  return
    '  <table class="search_result" border=1>'."\r\n".
    '  <tbody>'."\r\n".
    $header.
    $table.
    '  </tbody>'."\r\n".
    '  </table>'."\r\n";
}

function syno_sql_1 (&$sea_orig,&$sea_tran,$ofs,$lim,$params) {
  global $bind_params, $bind_types;
  
  $sea_orig = preg_replace("/\s+/", " ",$params->sea_orig);
  $sea_tran = preg_replace("/\s+/", " ",$params->sea_tran);
  $order = $params->sort.[" asc"," desc"][$params->dir]; // todo
  $collate = ($params->ds ? "" : "utf8mb4_unicode_ci"); // the default for the SYNO table is utf8mb4_bin
  $where_orig = ($sea_orig ? gen_html_where("syno_orig", $sea_orig, $params->op_orig, $collate) : "");
  $where_tran = ($sea_tran ? gen_html_where("syno_tran", $sea_tran, $params->op_tran, $collate) : "");
  
  if (!$params->book) {
    $join = "";
  } else {
    $join = "INNER JOIN vers v USING (vers_id) LEFT JOIN chap USING (chap_id) ";
    $where_orig = "(v.book_id = $params->book)".
      ($params->part ? " AND (part_id = $params->part)" : "") .
      ($params->chap ? " AND (chap_id = $params->chap)" : "") .
      " AND ".$where_orig;
  }

  $sql =
    "SELECT syno_orig orig, syno_tran tran, min(s.vers_ref) vers FROM syno s ".$join."WHERE $where_orig".
    (($sea_orig && $sea_tran) ? " AND " : "")."$where_tran ".
    " group by syno_orig, syno_tran ORDER BY $order".($lim ? " LIMIT ?,? " : "");
  if ($lim) {
    $bind_params[] = $ofs; $bind_types .= 'i'; $bind_params[] = $lim; $bind_types .= 'i';
  }
  return $sql;
}

function syno_sql_2 ($raw_orig,$raw_tran,$params) {
  global $bind_params, $bind_types;

  $sql =
    "SELECT DISTINCT v.vers_ref, v.vers_url, v.book_id, ifnull(v.chap_id,0), ifnull(part_id,0) ".
    "FROM syno s INNER JOIN vers v USING (vers_id) LEFT JOIN chap USING (chap_id) ".
    "WHERE ".($params->book ? "(v.book_id = $params->book) AND " : "").
    ($params->part ? "(part_id = $params->part) AND ": "").
    ($params->chap ? "(chap_id = $params->chap) AND ": "").
    "syno_orig = ? AND syno_tran = ? ORDER BY v.vers_ref ";
  $bind_params[] = $raw_orig; $bind_types .= 's';
  $bind_params[] = $raw_tran; $bind_types .= 's';
  
  return $sql;
}

function get_href($vers_ref, $url) {
  return "<a href='$url' target='_blank'>".$vers_ref."</a>";
}

function gen_html_where($field, $target, $op, $collate) {
  global $bind_params, $bind_types;

  $where = "";
//  if ($collate) $field = $field." COLLATE utf8mb4_unicode_ci";
  if ($collate) $field = $field." COLLATE ".$collate;
  switch (true) {
    case ($op == "equals"):
      $where = "$field = ?"; $bind_params[] = $target; $bind_types .= 's'; break;
    case ($op == "contains"):
      $where = "$field LIKE ?"; $bind_params[] = "%$target%"; $bind_types .= 's'; break;
    case ($op == "starts"):
      $where = "$field LIKE ?"; $bind_params[] = "$target%"; $bind_types .= 's'; break;
    case ($op == "ends"):
      $where = "$field LIKE ?"; $bind_params[] = "%$target"; $bind_types .= 's'; break;
    case (($op == "contains_any") || ($op == "starts_any") || ($op == "ends_any") || ($op == "contains_all")):
      $words = explode(" ", str_replace("-"," ",$target));
      $cnt = sizeof($words);
      $coord = ($op == "contains_all" ? " AND " : " OR ");
      $where = "(";
      $like = "";
      for ($i = 0; $i < $cnt; $i++) {
        if ($words[$i] == '') continue;
        switch (true) {
          case (($op == "contains_any") || ($op == "contains_all")):
            $like = "%$words[$i]%"; break;
          case ($op == "starts_any"):
            $like = "$words[$i]%"; break;
          case ($op == "ends_any"):
            $like = "%$words[$i]"; break;
        }
        if ($i > 0) $where .= $coord;
        $where .= $field." LIKE ?";
        $bind_params[] = $like; $bind_types .= 's';
      }
      $where .= ")";
      break;
  }
  return $where;
}

?>
