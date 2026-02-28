<?php

function vs_html($mysqli) {
  return
    '<script type="text/javascript">'."\r\n".
    'var p_sheet = "{{tab-sheet}}"; '."\r\n".
    'var p_search1 = "{{search-1}}"; '."\r\n".
    'var p_search2 = "{{search-2}}"; '."\r\n".
    'var p_ds = {{diacritic-sensitive}}; '."\r\n".
    'if (p_sheet == "") p_sheet = "catg"; '."\r\n".
    'init_main(p_sheet, p_search1, p_search2, p_ds); '."\r\n".
    '</script>'."\r\n";
}

?>