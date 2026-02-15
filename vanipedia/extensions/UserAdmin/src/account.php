<?php
$live_server = true;
$endPoint = "https://".petal_url("vanipedia")."/w/api.php";
$cookie = "./cookies/".session_id().".txt";

$func = @$_GET['func'];
if ($func == "user_info") {
  get_user_info();
}
else if ($func == "user_rights") {
  echo json_encode(get_user_rights());
}
else if ($func == "exec_login") {
  $petal = @$_GET['petal'];
  $user = @$_GET['user'];
  $password = @$_GET['password'];
  exec_login($petal,$user,$password,true);
}
else if ($func == "exec_logout") {
  exec_logout();
}
else if ($func == "create_account") {
  $petal = @$_GET['petal'];
  $user = @$_GET['user'];
  $password = @$_GET['password'];
  $retype = @$_GET['retype'];
  create_account($petal,$user,$password,$retype);
}

function petal_url($petal) {
  global $live_server;
  
  return ($live_server ? "$petal.org" : "dev.$petal.org");
}

function get_user_info() {
  global $endPoint, $cookie;

  $url = $endPoint."?action=query&meta=userinfo&format=json";
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
  curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
  $output = curl_exec($ch);
  curl_close($ch);

  echo $output;
}

function get_login_token($petal) {
  global $dev, $cookie;

  $endPoint = "https://".petal_url($petal)."/w/api.php";

  $url = $endPoint."?action=query&meta=tokens&type=login&format=json";
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
  curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
  $output = curl_exec($ch);
  curl_close($ch);
  $result = json_decode($output, 1);
  return $result["query"]["tokens"]["logintoken"];
}

function exec_login($petal,$user,$password,$echo) {
  global $cookie;

  $endPoint = "https://".petal_url($petal)."/w/api.php";

  $params = [
    "action" => "clientlogin",
    "username" => $user,
    "password" => $password,
    "loginreturnurl" => "https://vanipedia.org/",
    "logintoken" => get_login_token($petal),
    "format" => "json"
  ];

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $endPoint );
  curl_setopt($ch, CURLOPT_POST,1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
  curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
  $output = curl_exec($ch);
  curl_close($ch);
  if ($echo) echo $output;
}

function get_create_account_token($petal) {
  global $cookie;
    
  $endPoint = "https://".petal_url($petal)."/w/api.php";

  $url = $endPoint."?action=query&meta=tokens&type=createaccount&format=json";
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
  curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
  $output = curl_exec($ch);
  curl_close($ch);
  $result = json_decode($output, 1);
  return $result["query"]["tokens"]["createaccounttoken"];
}

function create_account1($user,$password,$retype) {
  /* has no effect: probably not allowed */
  $path = "/home/vanimedia/".petal_url($petal)."/w/maintenance";
  $cmd = "php $path/createAndPromote.php --custom-groups=MenuEditor --force qqq " . escapeshellarg(getenv('MW_ADMIN_PASS') ?: 'PLACEHOLDER');
  $output = shell_exec($cmd);
  echo $output;
}

function create_account($petal,$user,$password,$retype) {
  global $cookie;

  exec_login($petal,getenv("MW_ADMIN_USER") ?: "Yadasampati",getenv("MW_ADMIN_PASS") ?: "PLACEHOLDER",false);
  $endPoint = "https://".petal_url($petal)."/w/api.php";
  $params = [
    "action" => "createaccount",
    "createtoken" => get_create_account_token($petal),
    "username" => $user,
    "password" => $password,
    "retype" => $retype,
    "createreturnurl" => "https://".petal_url($petal)."/",
    "format" => "json"
  ];

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $endPoint );
  curl_setopt($ch, CURLOPT_POST,1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
  curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
  $output = curl_exec($ch);
  curl_close($ch);
  echo $output;
}

function exec_logout() {
  global $endPoint, $cookie;
  $url = $endPoint."?action=logout";
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
  curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
  $output = curl_exec($ch);
  curl_close($ch);
}

function get_user_rights() {
  global $endPoint, $cookie;

  $params = [
    "action" => "query",
    "meta" => "userinfo",
    "uiprop" => "rights",
    "format" => "json"
  ];

  $url = $endPoint."?".http_build_query($params);
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
  curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
  $output = curl_exec($ch);
  curl_close($ch);

  $result = json_decode($output, 1);
  return ($result ? $result["query"]["userinfo"]["rights"] : []);
}

?>