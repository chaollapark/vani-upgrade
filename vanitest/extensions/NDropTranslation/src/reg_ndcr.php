<?php

function register_ndcr ($mysqli, $page_id, $user_name, $lang_code) {
  // determine the user id
  $sql = "select ifnull(max(user_id),0) from vanipedia.vanipedia_user where user_name = ?";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $user_name);
  $stmt->execute();
  $result = $stmt->get_result();

  $fields = $result->fetch_array();
  $user_id = $fields[0];

  // determine the language id
  $sql = "select ifnull(max(lang_id),0) from vp_search.lang where lang_code = ?";
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $lang_code);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $fields = $result->fetch_array();
  $lang_id = $fields[0];

  // insert the new registration
  $sql = "insert into vp_translate.ndcr (user_id, lang_id, page_id) values($user_id, $lang_id, ?)";
    
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('i', $page_id);
  $stmt->execute();
  
  return 1;  
}

?>