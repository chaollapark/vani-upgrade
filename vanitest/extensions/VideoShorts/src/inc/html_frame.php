<?php 
function html_frame($session_key) {
  return
    "<div id='div_main'></div>\r\n".
    "<script type='text/javascript'>\r\n".
    "  initPage('div_main','".$session_key."');\r\n".
    "</script>\r\n";
}
?>

