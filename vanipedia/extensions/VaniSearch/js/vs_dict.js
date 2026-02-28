function tab_page(pge_name, css_disp) {
  var i, tab_content, tab_buttons;
  tab_content = document.getElementsByClassName("tab_content");
  for (i = 0; i < tab_content.length; i++) {
    tab_content[i].style.display = "none";
  }
  tab_buttons = document.getElementsByClassName("tab_button");
  for (i = 0; i < tab_buttons.length; i++) {
    tab_buttons[i].className = tab_buttons[i].className.replace(" active", "");
  }
  document.getElementById("div_" + pge_name).style.display = css_disp;
  document.getElementById("tab_" + pge_name).className += " active";
}

function process_petal() {
  var e = document.getElementById("sel_petal");
  var petal = e.options[e.selectedIndex ].text;
  if (!confirm('Are you sure you want to generate dictionary entries for the ' + petal + ' petal?')) return;
  var petal_ref = e.value;
  var page_id = 0;
  var response = [];
  var idx = 0;
  var from_c = 0;
  var from_w = 0;
  elem = document.getElementById("div_vers_ref");
  elem.innerHTML = "Starting ...";

  while (page_id >= 0) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        response = xmlhttp.responseText.split("|@|");
        from_c = response[2];
        from_w = response[3];
        if (from_c == 0) {
          idx += 1;
          page_id = response[0];
          elem.innerHTML = idx + ": " + response[1];
        }
      }
    };

    var $url = 
      "/w/extensions/VaniSearch/util2/gen_dict.php?petal=" + petal_ref + 
      "&page=" + page_id + "&from_c=" + from_c + "&from_w=" + from_w + "&version=20";
    xmlhttp.open("GET", $url, false);
    xmlhttp.send();
  }
  elem.innerHTML = "Ready";
}

