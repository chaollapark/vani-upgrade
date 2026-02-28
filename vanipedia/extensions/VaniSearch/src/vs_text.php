<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

include ("inc/db_connect.inc");
include ("./../util/slog.php");

$g_anal = "";
$g_json = [];
$arr_terms = array(); $arr_pages = array();
$arr_texts = array(); $arr_titles = array();
$petal = "Vanisource"; $language = "English";

$func = @$_GET['func'];
$params = json_decode(@$_POST['params']);
if ($func == "nav_text") {
  $anal = @$_GET['anal'];
  if (!$anal) log_search ("text", $params->target, $params->op, $params->ww, 0, 0, 0, 1, "en");
  $result = get_nav_text($params,$anal);
} else if ($func == "text") {
  $slice = json_decode(@$_POST['slice']);
  $result = get_text($params, $slice);
}
echo $result;

function get_text($params, $slice) { // NB todo params->vanis are not used here
  global $arr_titles, $petal, $language;
  $tbl_rows = "";
  foreach ($slice as $elem) {
    $text = page_text($elem->page_id, $elem->cpos_from, $elem->cpos_until);
    $text = highlight($text, $params->op, $elem->cpos_from, $elem->mark_hits) ;
    $title = $arr_titles[$elem->page_id];
    $href = get_href($title, $params->op, $params->target);
    $tbl_rows .=
      '<tr><td rowspan=2 class="td_num">'.$elem->idx.'</td><td>'.str_replace("_"," ",$title).
      '</td><td class="td_center">'.$petal.'</td><td class="td_center">'.$language.
      '</td><td>'.$href.'</td></tr><tr><td colspan=4 class="limit_750">'.$text.'</td></tr>';
  }
  return gen_html_table($tbl_rows);
}

function check_hits($target,$text) {
  $transliterator = Transliterator::createFromRules(':: Any-Latin; :: Latin-ASCII; :: NFD; :: [:Nonspacing Mark:] Remove; :: Lower(); :: NFC;', Transliterator::FORWARD);
  $text = $transliterator->transliterate($text);
  $term = $transliterator->transliterate($target);

  /* ignore double quotes, used for italic markup */
  $words = explode(" ", $term);
  $expr = "";
  foreach($words as $i => $wrd) {
    $expr .= $wrd.($i == array_key_last($words) ? "" :"[\ \']+");
  }
  $expr = "/\b".$expr."\b/";
  preg_match_all($expr, $text, $check_hits, PREG_OFFSET_CAPTURE);
  
  return $check_hits[0];
}

function set_arr_idQ ($ww, $match_op, $exp_limit) {
  global $mysqli, $arr_terms;
  for ($t = 0; $t < count($arr_terms); $t++) {
    $sql =
      "select ifnull(max(dict_idQ),0) from dict where dict_text2 = '".$arr_terms[$t]['word']."'";
    $result = $mysqli->query($sql);
    $fields = $result->fetch_row();
    $arr_terms[$t]['idQ'] = $fields[0];
    if ($ww) {
      $arr_terms[$t]['match_words'] = [$arr_terms[$t]['word']];
      $arr_terms[$t]['match_idQs'] = [$fields[0]];
    }
    else get_matching_words($arr_terms[$t], $match_op, $exp_limit);
  }
}

function get_matching_words(&$term, $match_op, $exp_limit) {
  global $mysqli;
  $sql = 
    "select dict_text2, dict_idQ from dict where dict_text2 like '".
    ($match_op == "starts"?"":"%").$term['word'].($match_op == "ends"?"":"%")."' ".
    "group by dict_text2, dict_idQ";
  $result = $mysqli->query($sql);
  $num_records = $result->num_rows;
  if ($num_records > $exp_limit) {
    $term['match_words'] = [$term['word']];
    $term['match_idQs'] = [$term['idQ']];
    return;
  }
  while ($fields = $result->fetch_row()) {
    $term['match_words'][] = str_replace("'","''",$fields[0]);
    $term['match_idQs'][] = $fields[1];
  }
}

function gen_html_table ($tbl_rows) {
  $header =
    '  <tr>'."\r\n".
    '    <th>#</th>'."\r\n".
    '    <th id="text_titl" class="sortable">Page Title</th>'."\r\n".
    '    <th>Petal</th>'."\r\n".
    '    <th>Language</th>'."\r\n".
    '    <th></th>'."\r\n".
    '  </tr>';

  return
    '  <table class="search_result" border=1>'."\r\n".
    '  <tbody>'."\r\n".
    $header.
    $tbl_rows.
    '  </tbody>'."\r\n".
    '  </table>'."\r\n";
}

function get_href($page_title,$operator,$target) {
  global $petal;
  $url = "https://".strtolower($petal).".org/wiki/".$page_title;
  $url = str_replace('"','%22',$url);
  $param = "?hl=".
    ($operator == "contains" ? $target : str_replace(" ","|",$target));
  return '<a href="'.$url.$param.'" target="_blank">Goto Page</a>';
}

function debug_txt ($txt) {
  global $mysqli;
  $sql = "insert into dbug (dbug_text) values ('$txt')";
  $mysqli->query($sql);
}

function arr_implode($arr, $sep, $ww) {
  $str = ""; $add = false;
  foreach($arr as $term) {
    $str .= ($add ? $sep : "").$term['word'].($ww ? "" : $sep.implode("','",$term['match_words']));
    $add = true;
  }
  return $str;
}

function anal_terms() {
  global $arr_terms;
  $str = ""; 
  foreach($arr_terms as $term) {
    $str .= 
      "<b>seq</b> -> ".$term['seq']."<br>".
      "<b>word</b> -> ".$term['word']."<br>".
      "<b>freq</b> -> ".$term['freq']."<br>".
      "<b>idQ</b> -> ".$term['idQ']."<br>".
      "<b>match_words</b> -> ".implode(",",$term['match_words'])."<br>".
      "<b>match_idQs</b> -> ".implode(",",$term['match_idQs'])."<br><br>";
  }
  return $str;
}

function get_nav_text ($params,$anal) {
  global $mysqli, $arr_terms, $arr_pages, $g_json, $g_anal;
  $num_hits = 0; $missing = "";
  $ds = 0;
  $fld = ($ds ? "dict_text" : "dict_text2");
  comp_arr_terms($params->target, $params->ww, $fld, $arr_terms, $missing);

  if ($missing) return json_encode(["tot_records" => 0, "tot_pages" => 0, "json" => [], "anal" => "", "message" => ""]);

  set_arr_idQ($params->ww, $params->match_op, $params->exp_limit);
  $sql = sql_pages($params->vanis, $arr_terms, 0, count($arr_terms) - 1, $fld, $params->ww, $params->dir, 0);
  
  if ($anal) {
    $g_anal .= anal_terms().$sql;
    return json_encode(["tot_records" => 0, "tot_pages" => 0, "json" => [], "message" => "", "anal" => $g_anal]);
  }

  get_pages($sql);
  $num_pages = count($arr_pages);
  if ($num_pages > 10000) {
    return json_encode([
      "tot_records" => 0, "tot_pages" => 0, "json" => [], "anal" => "",
      "message" => "This search pattern occurs in more than 10000 pages: please confine your search", 
    ]);
  }

  if ($params->op == "contains") $params->prox = 1;
  
  for ($p = 0; $p < $num_pages; $p++) {
    $sql = sql_dipa($arr_pages[$p], $fld, 0, $params->ww);
    $result = $mysqli->query($sql);
    $num_records = $result->num_rows;
    $mark_terms = array(); $mark_hits = array();
    $cpos_from = -1; $wpos_from = -1; $cpos_prev = -1; $wpos_prev = -1;
    $num = 0;

    while ($fields = $result->fetch_row()) {
      $num++; $pushed = 0;
      
      $dict_text = $fields[0]; $dipa_cpos = $fields[1]; $dipa_wpos = $fields[2];
      $dict_idQ = $fields[3]; $page_id = $fields[4];
      $cpos_from = ($cpos_from == -1 ? $dipa_cpos : $cpos_from);
      $wpos_from = ($wpos_from == -1 ? $dipa_wpos : $wpos_from);
      $cpos_prev = ($cpos_prev == -1 ? $dipa_cpos : $cpos_prev);
      $wpos_prev = ($wpos_prev == -1 ? $dipa_wpos : $wpos_prev);
      
      if ($dipa_wpos - $wpos_prev <= $params->prox) {
        array_push($mark_terms, $dict_idQ);
        array_push($mark_hits, [$dipa_cpos,$dict_text]);
        $pushed = 1;
      }
      if (($dipa_wpos - $wpos_prev > $params->prox) || ($num == $num_records) ||
          ($params->op == "contains" && count($arr_terms) == count($mark_terms))) {
        if (all_terms($mark_terms, $params->op)) {
          $cpos_until = (($num == $num_records && $pushed) ? $dipa_cpos : $cpos_prev);
          score_hit_nav ($page_id, $cpos_from, $cpos_until, $mark_hits, $num_hits);
        }
        $cpos_from = $dipa_cpos; $wpos_from = $dipa_wpos;
        $mark_terms = array(); $mark_hits = array();
      }
      $cpos_prev = $dipa_cpos;
      $wpos_prev = $dipa_wpos;
      if (!$pushed) {
        array_push($mark_terms, $dict_idQ);
        array_push($mark_hits, [$dipa_cpos,$dict_text]);
        if ($num == $num_records && count($arr_terms) == 1)
          score_hit_nav ($page_id, $cpos_from, $cpos_from, $mark_hits, $num_hits);
      }
    }
  }

  $tot_pages = (int) ($num_hits / $params->rpp) + ($num_hits % $params->rpp ? 1 : 0);
  return json_encode([
    "tot_records" => $num_hits, "tot_pages" => $tot_pages, 
    "json" => $g_json, "message" => "", "anal" => $g_anal
  ]);
}

function score_hit_nav ($page_id, $cpos_from, $cpos_until, $mark_hits, &$num_hits) {
  global $g_json;
  
  $num_hits++;
  array_push($g_json, array('page_id' => $page_id, 'cpos_from' => $cpos_from, 'cpos_until' => $cpos_until, 'mark_hits' => $mark_hits, 'idx' => $num_hits));
}

function comp_arr_terms ($target, $ww, $fld, &$arr_terms, &$missing) {
  global $mysqli;
  //$arr = explode(" ",preg_replace("/\s+/", " ",str_replace("-"," ",$target)));
  $arr = explode(" ",preg_replace("/\s+/", " ",str_replace("'","''",$target)));
  $arr_tmp = []; $seq = 0;
  foreach ($arr as $word) {
    if (!$word) continue;
    $sql = "select ifnull(sum(dict_freq),0) from dict where $fld = '$word' and dict_search = 1";
    $result = $mysqli->query($sql);
    $values = $result->fetch_row();
    $freq = $values[0];
    if ($ww && ($freq == 0)) $missing .= ",".$word;
    else array_push($arr_tmp, array('seq' => $seq,'word' => $word, 'freq' => $freq, 'idQ' => 0, 'match_words' => [], 'match_idQs' => []));
    $seq++;
  }
  if ($ww) $missing = mb_substr($missing,1);

  // sort the terms from low to high frequency and then mix them
  array_multisort(array_column($arr_tmp, "freq"), SORT_ASC, $arr_tmp);
  $last = count($arr_tmp) - 1;
  for ($i = 0; $i <= $last; $i++) {
    array_push($arr_terms, $arr_tmp[$i]);
    if ($last <= $i) continue;
    array_push($arr_terms, $arr_tmp[$last]);
    $last -= 1;
  }
}

function page_text($page_id, $cpos_from, $cpos_prev) {
  global $mysqli, $arr_texts, $arr_titles;
  $len = $cpos_prev + 100 - $cpos_from;
  if (!array_key_exists($page_id,$arr_texts)){
    $sql =
      "select old_text, page_title ".
      "from vanisource.vanisource_page ".
      "inner join vanisource.vanisource_slots on slot_revision_id = page_latest ".
      "inner join vanisource.vanisource_content on content_id = slot_content_id ".
      "inner join vanisource.vanisource_text on old_id = substr(content_address,4) ".
      "where page_id = $page_id ";
    $result = $mysqli->query($sql);
    $fields = $result->fetch_row();
    $arr_texts[$page_id] = strip_wiki_formatting(strip_tags($fields[0]));
    $arr_titles[$page_id] = $fields[1];
  }
  return mb_substr($arr_texts[$page_id],max(0,$cpos_from - 50),$len);
}

function strip_wiki_formatting($text) {
  // remove bold
  $text = preg_replace("/'''(.*?)'''/u", '$1', $text);
  // remove italics
  $text = preg_replace("/''(.*?)''/u", '$1', $text);
  return $text;
}

function all_terms ($mark_terms, $op) {
  global $arr_terms;
  if ($op == "contains_all") {
    for ($t = 0; $t < count($arr_terms); $t++) {
      $result = 0;
      for ($q = 0; $q < count($arr_terms[$t]['match_idQs']); $q++) {
        if (in_array($arr_terms[$t]['match_idQs'][$q],$mark_terms)) {$result = 1; break;}
      }
      if (!$result) return 0;
    }
  } else {
    if (count($arr_terms) != count($mark_terms)) return 0; /* todo: explain why sometimes $mark_terms is smaller than $arr_terms */
    for ($t = 0; $t < count($arr_terms); $t++) {
      $result = 0;
      for ($q = 0; $q < count($arr_terms[$t]['match_idQs']); $q++) {
        if ($arr_terms[$t]['match_idQs'][$q] == $mark_terms[$arr_terms[$t]['seq']]) {$result = 1; break;}
      }
      if (!$result) return 0;
    }
  }
  return 1;
}

function sql_dipa($page_id, $field, $wpos, $ww) {
  global $arr_terms;
  $and = ($wpos == 0 ? "" : "and dipa_wpos >= $wpos");
  $terms = arr_implode($arr_terms, "','", $ww);
  $sql =
    "select dict_text, dipa_cpos, dipa_wpos, dict_idQ, page_id ".
    "from vp_search.dipa ".
    "inner join dict using(dict_id) ".
    "where petl_id = 3 ".
    "  and page_id = $page_id ".
    "  and dict_search = 1 ".
    "  and $field in ('$terms') $and ".
    "order by dipa_wpos";
  return $sql;
}

function sql_pages($vanis, $terms, $from, $until, $field, $ww, $sortdir, $level) {
  $len = $until - $from + 1;
  if ($len == 0) return;

  if ($len <= 2) {
    $join_1 = ($ww ?
      "inner join dipa p1 on p1.dict_id = d1.dict_id and d1.$field = '".$terms[$from]['word']."' and d1.dict_search = 1 " :
      "inner join dipa p1 on p1.dict_id = d1.dict_id and d1.$field in ('".implode("','",$terms[$from]['match_words'])."') and d1.dict_search = 1 ");
    $join_2 = ($ww ?
      "inner join dict d2 on d2.dict_id = p2.dict_id and d2.$field = '".$terms[$until]['word']."' and d2.dict_search = 1 " :
      "inner join dict d2 on d2.dict_id = p2.dict_id and d2.$field in ('".implode("','",$terms[$until]['match_words'])."') and d2.dict_search = 1 ");
  }

  if ($level > 0) $extra = "";
  else $extra =
    "inner join vnpg v on v.page_id = p1.page_id and v.vani_id in (".implode(",",$vanis).") ".
    "inner join vanisource.vanisource_page s on s.page_id = p1.page_id order by s.page_title ".["asc","desc"][$sortdir];

  if ($len == 1) return
    "select distinct p1.page_id ".
    "from vp_search.dict d1 $join_1 $extra";
  else if ($len == 2) return
    "select distinct p1.page_id ".
    "from vp_search.dict d1 $join_1 inner join dipa p2 on p2.page_id = p1.page_id $join_2 $extra";
  else {
    $halve = $from + ceil($len / 2) - 1;
    return
      "select distinct p1.page_id from ".
      "(".sql_pages($vanis, $terms, $from, $halve, $field, $ww, $sortdir, $level + 1).") p1 ".
      "inner join ".
      "(".sql_pages($vanis, $terms, $halve + 1, $until, $field, $ww, $sortdir, $level + 1).") p2 ".
      "using (page_id) $extra";
  }
}

function get_pages ($sql) {
  global $mysqli, $arr_pages;
  $result = $mysqli->query($sql);
  while ($fields = $result->fetch_row()) {
    array_push($arr_pages,$fields[0]);
  }
  return;
}

function highlight($text, $op, $cpos_from, $mark_hits) {
  switch (true) {
    case ($op == "contains"):
      $ofs = 0; $dif = max(0,$cpos_from - 50); $dummy = "";
      for ($t = 0; $t < sizeof($mark_hits); $t++) {
        $word = $mark_hits[$t][1];
        if ($word == '') continue;
        $cpos = $mark_hits[$t][0] - $dif;
        $len = mb_strlen($word);
        
        $start = mb_substr($text,0,$ofs + $cpos);
        preg_match_all("/''/", $start, $match, PREG_OFFSET_CAPTURE);
        $quotes = count($match[0]) * 2;

        $start = str_replace("''","",$start);
        $ending = mb_substr($text,$ofs + $cpos + $len);
        
        $start_tag = ""; $end_tag = ""; $plus = 0;
        if ($t == 0) {
          $start_tag = "<span class='mark'>"; $plus = 19;
        }
        if ($t == array_key_last($mark_hits)) {
          $end_tag = "</span>"; $plus = 7;
          $ending = str_replace("''","",$ending);
        }
        $text = $start.$start_tag.$word.$end_tag.$ending;
        $ofs += $plus - $quotes;
      }
      break;
    case ($op == "contains_all"):
      $ofs = 0; $dif = max(0,$cpos_from - 50);
      for ($t = 0; $t < sizeof($mark_hits); $t++) {
        $word = $mark_hits[$t][1];
        if ($word == '') continue;
        $cpos = $mark_hits[$t][0] - $dif;
        $len = mb_strlen($word);
        
        $start = mb_substr($text,0,$ofs + $cpos);
        preg_match_all("/''/", $start, $match, PREG_OFFSET_CAPTURE);
        $quotes = count($match[0]) * 2;
        
        $start = str_replace("''","",$start);
        $ending = mb_substr($text,$ofs + $cpos + $len);
        if ($t == array_key_last($mark_hits)) $ending = str_replace("''","",$ending);
        
        $text =
          $start."<span class='mark'>".
          $word."</span>".
          $ending;
        $ofs += 26 - $quotes;
      }
      break;
  }
  return $text;
}

?>
