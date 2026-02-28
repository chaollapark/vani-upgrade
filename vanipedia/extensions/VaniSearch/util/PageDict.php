<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

include("dict_lib.php");
do_updates ();
do_deletions ();

function do_updates () {
  global $mysqli;

    "select page_title, old_text from vanipedia.vanipedia_page ".
    "inner join vanipedia.vanipedia_slots on slot_revision_id = page_latest ".
    "inner join vanipedia.vanipedia_content on content_id = slot_content_id ".
    "inner join vanipedia.vanipedia_text on old_id = substr(content_address,4) ".

  // pages to be processed
  $sql = 
    "select p.page_id, r.rev_timestamp, t.old_text ". 
    "from vp_search.page ".
    "inner join vanisource.vanisource_page p using (page_id) ".
    "inner join vanisource.vanisource_revision r on r.rev_id = p.page_latest ".
    "inner join vanisource.vanisource_slots s on s.slot_revision_id = p.page_latest ".
    "inner join vanisource.vanisource_content c on c.content_id = s.slot_content_id ".
    "inner join vanisource.vanisource_text t on t.old_id = substr(c.content_address,4) ".
    "where petl_id = 3 and page_status in (0,13) ";
  $result = $mysqli->query($sql);

  while ($fields = $result->fetch_array()) {
    $page_id = $fields[0];
    $page_time = $fields[1];
    $page_text = $fields[2];

    $ok = process_content ($page_id, strip_wiki_formatting(strip_tags($page_text)), 0);
    if (!$ok) continue;

    // set the page status to "processed" and set the time stamp
    SetPageStatus ($page_id, 1, $page_time);
  }
}

function do_deletions () {
  global $mysqli;

  // pages to be deleted
  $sql = 
    "select page_id ".
    "from vp_search.page ".
    "where petl_id = 3 and page_status = 5 ";
  $result = $mysqli->query($sql);

  while ($fields = $result->fetch_array()) {
    $page_id = $fields[0];
    del_old_entries($page_id);

    // remove the page registration
    $sql = 
      "delete from vp_search.page where petl_id = 3 and page_id = $page_id ";
    $mysqli->query($sql);
  }
}

function strip_wiki_formatting($text) {
  // remove bold
  $text = preg_replace("/'''(.*?)'''/u", '$1', $text);
  // remove italics
  $text = preg_replace("/''(.*?)''/u", '$1', $text);
  return $text;
}

?>