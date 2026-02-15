<?php
include ("inc/db_connect.php");
include ("inc/count_quotes.php");
$sections = ["BG"=>0,"SB"=>0,"CC"=>0,"OB"=>0,"Lec"=>0,"Con"=>0,"Let"=>0]; /* todo: dynamic from table VQUO */
countQuotes($sections,"A");
?>