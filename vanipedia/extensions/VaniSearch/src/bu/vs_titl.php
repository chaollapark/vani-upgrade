<?php
include ("inc/db_connect.inc");
include ("./../util/slog.php");
//include ("util/vp_accents.php");

$func = @$_GET['func'];
$params = json_decode(@$_POST['params']);
if (($func == "nav_catg") || ($func == "nav_page")) {
  //$target = remove_accents(@$_GET['target']);
  $type = substr($func,4);
  log_search ($type, $params->target, $params->op, $params->ww, $params->ds, $params->vp, $params->vq, $params->vs, $params->lang);
  $result = get_nav_titl($type, $params);
} else if (($func == "catg") || ($func == "page")){
  //$target = remove_accents(@$_GET['target']);
  $ofs = @$_GET['ofs'];
  $lim = @$_GET['lim'];
  $page = @$_GET['page'];
  $result = get_titl($func, $ofs, $lim, $page, $params);
}
echo $result;

function debug_txt ($txt) {
  global $mysqli;
  $txt = $mysqli->real_escape_string($txt);
  $sql = "insert into dbug (dbug_text) values ('$txt')";
  $mysqli->query($sql);
}

function get_nav_titl($type, $params) {
  global $mysqli;
    
  if (!$params->target) return "";
  $json = [];
  $target = $mysqli->real_escape_string($params->target);
  //$target = iconv('UTF-8', 'ASCII//TRANSLIT', $target);
  $nspace = 0;
  if ($type == "catg") $nspace = 14;
  $sql = "";
  if ($params->vp) $sql = gen_sql("vanipedia",$nspace, $target, $params->op, $params->lang, $params->ww, $params->ds);
  if ($params->vq) {
    if ($sql) $sql .= " UNION ALL ";
    $sql .= gen_sql("vaniquotes",$nspace, $target, $params->op, $params->lang, $params->ww, $params->ds);
  }
  if ($params->vs) {
    if ($sql) $sql .= " UNION ALL ";
    $sql .= gen_sql("vanisource",$nspace, $target, $params->op, $params->lang, $params->ww, $params->ds);
  }
  if ($params->vm) {
    if ($sql) $sql .= " UNION ALL ";
    $sql .= gen_sql("vanimedia",$nspace, $target, $params->op, $params->lang, $params->ww, $params->ds);
  }
  $order = "$params->sort ".["asc","desc"][$params->dir];
  $sql .= " ORDER BY $order "; 

  regexp_translit_prepare ($params->ds,$params->op,$target,$transliterator,$tl_target,$beg,$end,$words);
  $result = $mysqli->query($sql);
  $num_rows = $result->num_rows;
  $num_hits = 0; $idx = 0; $ofs = -1;
  while ($values = $result->fetch_row()) {
    $idx++;
    $raw_text = $values[0];
    $title = str_replace("_"," ",($params->ds ? $raw_text : $transliterator->transliterate($raw_text)));
    $hit = ($params->ww ? regexp_translit_match ($tl_target,$title,$params->op,$beg,$end,$words) : 1);
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

function gen_sql($dbase, $nspace, $target, $op, $lang, $ww, $ds) {
  $petal = ucfirst($dbase);
  $where = gen_sql_where($target, $op, $lang, $ww, ($ds ? "utf8_bin" : ""));
  $sql =
    "SELECT convert(binary p.page_title using utf8) titl, '".$petal."' petl, l.lang_english lang ".
    "FROM $dbase.$dbase"."_page p ".
    "INNER JOIN lang l ON p.page_lang = l.lang_code ".
    "WHERE $where AND p.page_namespace = $nspace ";
  return $sql;

}

function get_titl($type, $ofs, $lim, $page, $params) {
  global $mysqli;
  if (!$params->target) return "";
  $target = $mysqli->real_escape_string($params->target);
  //$target = iconv('UTF-8', 'ASCII//TRANSLIT', $target);
  
  if ($type == "catg") {
    $nspace = 14;
    $head = "Category Name";
    $prefix = "Category:";
    $goto = "Goto Category";
  }
  if ($type == "page") {
    $nspace = 0;
    $head = "Page Title";
    $prefix = "";
    $goto = "Goto Page";
  }

  $sql = "";
  if ($params->vp)
  {
    $sql .= "(".gen_sql("vanipedia",$nspace, $target, $params->op, $params->lang, $params->ww, $params->ds).")";
  }
  if ($params->vq)
  {
    if ($sql) $sql .= " UNION ALL ";
    $sql .= "(".gen_sql("vaniquotes",$nspace, $target, $params->op, $params->lang, $params->ww, $params->ds).")";
  }
  if ($params->vs)
  {
    if ($sql) $sql .= " UNION ALL ";
    $sql .= "(".gen_sql("vanisource",$nspace, $target, $params->op, $params->lang, $params->ww, $params->ds).")";
  }
  if ($params->vm)
  {
    if ($sql) $sql .= " UNION ALL ";
    $sql .= "(".gen_sql("vanimedia",$nspace, $target, $params->op, $params->lang, $params->ww, $params->ds).")";
  }
  $order = "$params->sort ".["asc","desc"][$params->dir];
  $sql .= " ORDER BY $order LIMIT $ofs,$lim ";

  // echo "<div style='color:orangered'>".$sql."</div>";
  regexp_translit_prepare ($params->ds,$params->op,$target,$transliterator,$tl_target,$beg,$end,$words);
  $result = $mysqli->query($sql);
  $table = "";
  $idx = ($page - 1) * $params->rpp + 1;
  while ($fields = $result->fetch_array()) {
    $raw_text = $fields[0];
    $title = str_replace("_"," ",($params->ds ? $raw_text : $transliterator->transliterate($raw_text)));
    $hit = ($params->ww ? regexp_translit_match ($tl_target,$title,$params->op,$beg,$end,$words) : 1);
    if (!$hit) continue;

    $text = str_replace("_"," ",$fields[0]);
    $petal = $fields[1];
    $lang = $fields[2];
    $title = explode("/", $fields[0]);
    $title[count($title)-1] = urlencode($title[count($title)-1]);
    $title = implode("/", $title);
    $url = "https://".strtolower($petal).".org/wiki/".$prefix.$title;
    $href = get_href($goto,$url);
    $text = highlight($transliterator, $text, $target, $params->op, $params->ww, $params->ds, $beg, $end, $words);

    $table .=
      '<tr><td class="td_num">'.$idx.'</td><td class="limit_750">'.$text.'</td><td>'.$petal.
      '</td><td class="td_center">'.$lang.'</td><td>'.$href.'</td></tr>' . "\r\n";
    $idx += 1;
  }

  $header =
    '  <tr>'."\r\n".
    '    <th>#</th>'."\r\n".
    '    <th id="'.$type.'_titl" class="sortable">'.$head.'</th>'."\r\n".
    '    <th id="'.$type.'_petl" class="sortable">Petal</th>'."\r\n".
    '    <th id="'.$type.'_lang" class="sortable">Language</th>'."\r\n".
    '    <th></th>'."\r\n".
    '  </tr>';

  return
    '  <table class="search_result" border=1>'."\r\n".
    '  <tbody>'."\r\n".
    $header.
    $table.
    '  </tbody>'."\r\n".
    '  </table>'."\r\n";
}

function get_href($text, $url) {
  $url = str_replace('"','%22',$url);
  return '<a href="'.$url.'" target="_blank">'.$text.'</a>';
}

function highlight($transliterator, $text, $target, $op, $ww, $ds, $beg, $end, $words) {
  $arr1 = []; $arr2 = []; 
  $text2 = $text; 
  if (!$ds) {
//    $rules = ":: Any-Latin; :: Latin-ASCII; :: NFD; :: [:Nonspacing Mark:] Remove; :: Lower(); :: NFC;";
//    $transliterator = Transliterator::createFromRules($rules, Transliterator::FORWARD);
    $target = $transliterator->transliterate($target);

    $textchars = preg_split('//u', $text, null, PREG_SPLIT_NO_EMPTY);
    $text2 = "";
    $translen = 0;
    foreach ($textchars as $idx=>$value) {
      $arr1[$idx] = [$value, $transliterator->transliterate($value)];
    }
    foreach($arr1 as $idx => $value) {
      $text2 .= $value[1];
      $arr2[$translen] = $idx;
      $translen += strlen($value[1]);
    }
  }
  $mark = 0;
  switch (true) {
    case (($op == "contains") || ($op == "starts") || ($op == "ends")):
      $pattern = ($ww ? '/\b'.$target.'\b/u' : '/'.$target.'/u');
      $mark = 1;
      break;
    case (($op == "contains_all") || ($op == "contains_any") || ($op == "starts_any") || ($op == "ends_any")):
      $words = implode("|",explode(" ", str_replace("-"," ",$target)));
      $pattern = ($ww ? '/\b('.$words.')\b/u' : '/'.$words.'/u');
      $mark = 1;
      break;
  }
  if ($mark) {
    preg_match_all($pattern, $text2, $matches, PREG_OFFSET_CAPTURE);
    $ofs = 0;
    for ($t = 0; $t < sizeof($matches[0]); $t++) {
      $str = $matches[0][$t][0]; /* NB! preg_match_all result */
      $cpos = $matches[0][$t][1];
      $len = ($ds ? strlen($str) : mb_strlen($str,'utf8')); /* todo ONLY STRLEN? */
      if ($ds) {
        $text =
          substr($text,0,$ofs + $cpos)."<span class='mark'>".
          substr($text,$ofs + $cpos,$len)."</span>".
          substr($text,$ofs + $cpos + $len);
      }
      else {
        $part1 = mb_substr($text,0,$ofs + $arr2[$cpos],'utf8');
        if (array_key_exists($cpos + $len, $arr2)) $lenx = $arr2[$cpos + $len] - $arr2[$cpos];
        else $lenx = count($arr1) - $arr2[$cpos];
        $part2 = mb_substr($text,$ofs + $arr2[$cpos],$lenx,'utf8');
        $part3 = mb_substr($text,$ofs + $arr2[$cpos] + $lenx,1000,'utf8');
        $text = $part1."<span class='mark'>".$part2."</span>".$part3;
      }
      $ofs += 26;
    }
  }
  return $text;
}

function gen_sql_where($target, $op, $lang, $ww, $collate) {
  $where = "";
//  if ($collate) $field = $field." COLLATE utf8mb4_unicode_ci";
  /*if ($ww && (($op == "contains") || ($op == "starts") || ($op == "ends"))) $target = strtolower($target);
  else */$target = str_replace(" ","_",strtolower($target));
  
//  $field = "replace_accents(lower(convert(binary p.page_title using utf8)))";
  $field = "lower(convert(binary p.page_title using utf8))";
  if ($collate) $field = $field." COLLATE ".$collate;
  switch (true) {
    case ($op == "equals"):
      $where = $field." = '$target'"; 
      break;
    case ($op == "contains"):
      $where = "$field LIKE '%$target%'";
      break;
    case ($op == "starts"):
      $where = "$field LIKE '$target%'";
      break;
    case ($op == "ends"):
      $where = "$field LIKE '%$target'";
      break;
    case (($op == "contains_any") || ($op == "starts_any") || ($op == "ends_any") || ($op == "contains_all")):
      $words = explode("_", str_replace("-","_",$target));
      $cnt = sizeof($words);
      $coord = ($op == "contains_all" ? " AND " : " OR ");
      $where = "(";
      $like = "";
      for ($i = 0; $i < $cnt; $i++) {
        if ($words[$i] == '') continue;
        if ($i > 0) $where .= $coord;
        switch (true) {
          case (($op == "contains_any") || ($op == "contains_all")):
            $where .= "$field  LIKE '%$words[$i]%'"; break;
          case ($op == "starts_any"):
            $where .= "$field LIKE '$words[$i]%'"; break;
          case ($op == "ends_any"):
            $where .= "$field LIKE '%$words[$i]'"; break;
        }
      }
      $where .= ")";
      break;
  }
  $where .= ($lang ? " AND lang_code = '".$lang."'" : '');
  return $where;
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

?>
