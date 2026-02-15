<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include ("inc/db_connect.inc");

$params = []; $types = '';

$func = @$_GET['func'];
if ($func == "get_master") {
  $petal = @$_GET['petal'];
  $view = @$_GET['view'];
  $filt = @$_GET['filt'];
  if ($view == "group") $html = get_groups($petal, "");
  else if ($view == "user") $html = get_users($petal, "", $filt);
  else if ($view == "config") $html = get_config($petal, "");
} 
if ($func == "get_ins_data") {
  $petal = @$_GET['petal'];
  $view = @$_GET['view'];
  $key = @$_GET['key'];
  if ($view == "group") $html = get_users($petal, $key, "");
  else if ($view == "user") $html = get_groups($petal, $key);
} 
else if ($func == "ins_groups") {
  $petal = @$_GET['petal'];
  $key = @$_GET['key'];
  $range = json_decode(@$_POST['range']);
  $html = ins_groups($petal, $key, $range);
}
else if ($func == "ins_users") {
  $petal = @$_GET['petal'];
  $key = @$_GET['key'];
  $range = json_decode(@$_POST['range']);
  $html = ins_users($petal, $key, $range);
}
else if ($func == "del_groups") {
  $petal = @$_GET['petal'];
  $key = @$_GET['key'];
  $range = json_decode(@$_POST['range']);
  $html = del_groups($petal, $key, $range);
}
else if ($func == "del_users") {
  $petal = @$_GET['petal'];
  $key = @$_GET['key'];
  $range = json_decode(@$_POST['range']);
  $html = del_users($petal, $key, $range);
}
else if ($func == "update_user") {
  $petal = @$_GET['petal'];
  $user = @$_GET['user'];
  $email = @$_GET['email'];
  $realname = @$_GET['realname'];
  $html = update_user($petal, $user, $email, $realname);
}

echo $html; return;

function petal_ok($petal) {
  return in_array($petal, ['vanipedia','vaniquotes','vanisource','vanimedia']);
}

function get_groups($petal, $user) {
  global $mysqli;

  if (!petal_ok($petal)) return 0;
  
  $sql = sql_groups($petal, $user);
  $result = $mysqli->query($sql);
  
  $arr_groups = []; 
  while ($values = $result->fetch_row()) {
    $id = $values[0];
    $user = $values[1];
    $group = $values[2];
    if (!$group) continue;
    if (!array_key_exists($group, $arr_groups)) {
      $arr_groups[$group] = []; }
    array_push($arr_groups[$group], 
      ["id" => $id, "name" => $user]);
  }
  return json_encode($arr_groups);
}

function sql_groups($petal, $user) {
  global $mysqli;
  
  $where = "";
  if ($user) {
    $sql = "select user_id from $petal.$petal"."_user where user_name = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param('s', $user);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $values = $result->fetch_row();
    $user_id = $values[0];
    $where = 
      "where not exists (select 1 from $petal.$petal"."_user_groups b where b.ug_user = $user_id and b.ug_group = a.ug_group)";
  }
  $sql =
    "select user_id, user_name, a.ug_group ".
    "from $petal.$petal"."_user_groups a ".
    "inner join $petal.$petal"."_user on user_id = ug_user ".
    "$where order by ug_group, user_name ";
  return $sql;    
}

function get_users($petal, $group, $filt) {
  global $mysqli, $params, $types;

  if (!petal_ok($petal)) return 0;
  
  $sql = sql_users($petal, $group, $filt);
  $stmt = $mysqli->prepare($sql);
  if ($types) $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $result = $stmt->get_result();

  $arr_users = []; 
  while ($values = $result->fetch_row()) {
    $id = $values[0];
    $user = $values[1];
    $group = $values[2];
    if (!array_key_exists($user, $arr_users)) {
      $arr_users[$user] = ["id" => $id, "groups" => [], "configs" => []]; }
    if ($group) array_push($arr_users[$user]["groups"], $group);
  }

  foreach ($arr_users as $user_name => $user) {
    $sql =
      "select prop_id, prop_name, prop_default, prop_desc, up_value ".
      "from $petal.$petal"."_user_properties ".
      "inner join vp_admin.prop on prop_name = up_property ".
      "where up_user = ".$user["id"]." ".
      "order by prop_name ";
    $result = $mysqli->query($sql);
    while ($values = $result->fetch_row()) {
      $id = $values[0];  $prop = $values[1]; $default = $values[2]; 
      $desc = $values[3]; $prop_value = $values[4];
      array_push($arr_users[$user_name]["configs"], [
        "id" => $id, 
        "name" => $prop, 
        "default" => $default, 
        "desc" => $desc, 
        "value" => $prop_value
      ]);
    }
  }
  return json_encode($arr_users);
}

function sql_users($petal, $group, $filt) {
  global $params, $types;
  
  $where = "";
  if ($group) {
    $where = "where not exists (select 1 from $petal.$petal"."_user_groups b where b.ug_group = ? and b.ug_user = a.ug_user) ";
    $params[] = $group; $types .= 's';
  }
  if ($filt) {
    $like = '%'.strtolower($filt).'%';
    $where = ($where ? "$where and " : "where ")."lower(convert(user_name using utf8mb4)) like ? ";
    $params[] = $filt; $types .= 's';
  }
  $sql =
    "select user_id, user_name, ug_group from $petal.$petal"."_user ".
    "left join $petal.$petal"."_user_groups a on ug_user = user_id ".
    "$where order by user_name "; 
  return $sql;    
}

function get_config($petal) {
  global $mysqli;

  if (!petal_ok($petal)) return 0;
  
  $sql = sql_config($petal);
  $result = $mysqli->query($sql);
  
  $arr_config = []; 
  while ($values = $result->fetch_row()) {
    $prop_id = $values[0];
    $prop = $values[1];
    $default = $values[2];
    $desc = $values[3];
    $user_id = $values[4];
    $user_name = $values[5];
    $prop_value = $values[6];
    
   if (!array_key_exists($prop, $arr_config))
      $arr_config[$prop] = ["id" => $prop_id, "name" => $prop, "default" => $default, "desc" => $desc, "users" => []]; 
   if ($user_id)
     array_push($arr_config[$prop]["users"], 
       ["id" => $user_id, "name" => $user_name, "value" => $prop_value]);
  }
  return json_encode($arr_config);
}

function sql_config($petal) {
  $sql =
    "select prop_id, prop_name, prop_default, prop_desc, user_id, user_name, up_value ".
    "from vp_admin.prop ".
    "left join $petal.$petal"."_user_properties on up_property = prop_name ".
    "left join $petal.$petal"."_user on user_id = up_user ".
    "order by prop_name ";
  return $sql;    
}

function ins_groups($petal, $user, $range) {
  global $mysqli, $params, $types;

  if (!petal_ok($petal)) return 0;
  
  $sql = "select user_id from $petal.$petal"."_user where user_name = '$user'";
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('s', $user);
  $stmt->execute();
  $result = $stmt->get_result();

  $values = $result->fetch_row();
  $user_id = $values[0];
  
  $sql = "insert into $petal.$petal"."_user_groups (ug_user,ug_group) values ";
  foreach ($range as $idx => $group) {
    $sql .= "($user_id, ?)";
    $params[] = $group; $types .= 's';
    if ($idx != array_key_last($range)) $sql .= ",";
  }
  
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();

  return '{"status":"ok"}';
}

function ins_users($petal, $group, $range) {
  global $mysqli, $params, $types;
  
  if (!petal_ok($petal)) return 0;
  
  $placeholders = implode(',', array_fill(0, count($range), '?'));
  $params = array_merge([$group], $range);
  $types = str_repeat('s', count($params));
  
  $sql =
    "insert into $petal.$petal"."_user_groups (ug_user,ug_group) ".
    "(select user_id, ? from $petal.$petal"."_user ".
    " where user_name in ($placeholders))";

  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
  
  return '{"status":"ok"}';
}

function del_groups($petal, $user, $range) {
  global $mysqli, $params, $types;

  if (!petal_ok($petal)) return 0;
  
  $placeholders = implode(',', array_fill(0, count($range), '?'));
  $params = array_merge([$user], $range);
  $types = str_repeat('s', count($params));
  
  $sql =
    "delete from $petal.$petal"."_user_groups ".
    "where ug_user = ".
    "(select user_id from $petal.$petal"."_user where user_name = ?) ".
    "and ug_group in ($placeholders)";
    
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
  
  return '{"status":"ok"}';
}

function del_users($petal, $group, $range) {
  global $mysqli, $params, $types;
  
  if (!petal_ok($petal)) return 0;
  
  $placeholders = implode(',', array_fill(0, count($range), '?'));
  $params = array_merge([$group], $range);
  $types = str_repeat('s', count($params));
  
  $sql =
    "delete from $petal.$petal"."_user_groups ".
    "where ug_group = ? and ug_user in ".
    "(select user_id from $petal.$petal"."_user ".
    " where user_name in ($placeholders))";
    
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
  
  return '{"status":"ok"}';
}

function update_user($petal, $user, $email, $realname) {
  global $mysqli;
  
  if (!petal_ok($petal)) return 0;
  
  $sql = "update $petal.$petal"."_user set user_email = ?, user_real_name = ? where user_name = ?";
    
  $stmt = $mysqli->prepare($sql);
  $stmt->bind_param('sss', [$email,$realname,$user]);
  $stmt->execute();
  
  return '{"status":"ok"}';
}

?>
