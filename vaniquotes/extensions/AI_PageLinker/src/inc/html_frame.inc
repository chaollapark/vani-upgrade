<?php 
function html_frame() {
  return
    '<div id="div_main"></div>'."\r\n".
    '<script type="text/javascript">'."\r\n".
    'initPage("div_main"); '."\r\n".
    '</script>'."\r\n";
}
?>