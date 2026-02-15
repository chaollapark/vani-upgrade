<?php

$config = require '/var/www/vanipedia/vanipedia.env.php';
$mysqli;
dbConnect();

$wgHooks['ArticleDeleteComplete'][] = 'onArticleDeleteComplete';
$wgHooks['ArticleUndelete'][] = 'onArticleUndelete';

function onArticleDeleteComplete ($article, $user, $reason, $page_id) {
  global $mysqli;

  $sql = "update ndcr set ndcr_deleted = 1 where page_id = $page_id ";
  $mysqli->query($sql);
}

function onArticleUndelete ($title, $create, $comment, $page_id) {
  global $mysqli;

  $sql = "update ndcr set ndcr_deleted = 0 where page_id = $page_id ";
  $mysqli->query($sql);
}

function dbConnect () {
  global $mysqli, $config;

  $host = "localhost";
  $user = $config['DB_USER'];
  $password = $config['DB_PASS'];
  $database = "vp_translate";
  $mysqli = new mysqli($host,$user,$password,$database);
  if ($mysqli->connect_error) {
    die('Connect Error (' . $mysqli->connect_errno . ') '
      . $mysqli->connect_error);
  }
}

?>