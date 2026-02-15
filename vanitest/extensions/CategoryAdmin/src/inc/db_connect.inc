<?php
$config = require '/var/www/vanitest/vanitest.env.php';
$host = "mariadb-prod";
$user = $config['DB_USER'];
$password = $config['DB_PASS'];
$database = "vp_search";
$mysqli = new mysqli($host,$user,$password,$database);
if ($mysqli->connect_error) {
    die('Connect Error (' . $mysqli->connect_errno . ') '
        . $mysqli->connect_error);
}
// $mysqli->query("set names utf8");
?>
