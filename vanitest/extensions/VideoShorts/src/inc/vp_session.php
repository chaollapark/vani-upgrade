<?php

function reg_session($mysqli,$user_id,$user_rights) {
  
  $sess_key = bin2hex(random_bytes(10));
  $sess_rights = "";
  foreach ($user_rights as $right) $sess_rights .= ",$right";
  $sess_rights = substr($sess_rights, 1);
  $sql = "insert into sess (user_id,sess_key,sess_rights) values($user_id,'$sess_key','$sess_rights')";
  $mysqli->query($sql);

  return $sess_key;
}

?>