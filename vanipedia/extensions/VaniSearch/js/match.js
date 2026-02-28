var g_matches = [];
var g_sel_match = 0;
var g_timeout;
var g_json_arr = [];
var g_words = [], g_word_data = [];

var g_word_match = {
  "catg": {"button": null, "active": true, "open": false},
  "page": {"button": null, "active": true, "open": false},
  "text": {"button": null, "active": true, "open": false}
}

function handle_key(e, type, inp_search, btn_search) {
  var kc = e.keyCode;
  
  if (!g_word_match[type].active) {
    if (kc == 13) btn_search.click();
    return;
  }
  
  if (kc == 9) return;
  else if (g_word_match[type].open && (kc == 13 || kc == 27 || kc == 38 || kc == 40)) {
    if (kc == 38 || kc == 40) e.preventDefault(); /* up and down arrows are reserved for the search-help */
    do_special_key(kc, inp_search, type); return;
  }
  else if (!g_word_match[type].open && kc == 13) {
    btn_search.click(); return;
  }
  
  clearTimeout(g_timeout);
  g_timeout = setTimeout(function() {get_matches(inp_search, type)}, 125);
}

function show_help(inp_search, type) {
  if (!g_word_match[type].active || g_word_match[type].open) return;
  div_word_match.classList.remove("hidden");
  g_word_match[type].open = true;
  
  div_word_match.style.top = inp_search.offsetTop + inp_search.offsetHeight + "px";
  div_word_match.style.left = inp_search.offsetLeft + "px";
  div_word_match.style.width = inp_search.offsetWidth + "px";
}

function hide_help(type) {
  if (!g_word_match[type].active) return;
  div_word_match.classList.add("hidden");
  g_word_match[type].open = false;
}

function get_matches(inp_search, type) {
  var str, lang, vp, vq, vs, vm;
  
  str = get_string(inp_search.value, inp_search.selectionStart);
  if (!str) { hide_help(type); return; }

  var ds = 0;
  var url = encodeURI("/w/extensions/VaniSearch/src/vs_util.php?func=match_" + type + "&str=" + str);
  
  if ((type == "catg") || (type == "page")) {
    lang = document.getElementById("sel_lang_" + type).value;
    vp = +document.getElementById("chb_vp_" + type).checked;
    vq = +document.getElementById("chb_vq_" + type).checked;
    vs = +document.getElementById("chb_vs_" + type).checked;
    vm = +document.getElementById("chb_vm_" + type).checked;
    url += "&lang=" + lang + "&vp=" + vp + "&vq=" + vq + "&vs=" + vs + "&vm=" + vm;
  }
  
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onload = function (e) {
    if (xhr.readyState == 4 && xhr.status === 200) {
      g_json_arr = JSON.parse(xhr.responseText);
      dsp_matches(inp_search, type);
    }
  };
  xhr.send(null);
}

function get_string(str, selstart) {
  var i, result = "";
  for (i = selstart - 1; i >= 0; i--) {
    if (" -'".indexOf(str[i]) != -1) break;
    result = str[i] + result;
  }
  for (i = selstart; i < str.length; i++) {
    if (" -'".indexOf(str[i]) != -1) break;
    result = result + str[i];
  }
  return result;
}

function dsp_matches(inp_search, type) {
  if (document.activeElement != inp_search) return;
  if (!inp_search.value.trim()) return;
  g_matches = [];
  g_sel_match = 0;
  if (!g_word_match[type].open) show_help(inp_search, type);
  div_word_match.innerHTML = "";
  for (var i=0; i < g_json_arr.length; i++) {
    var span = document.createElement("span");
    span.textContent = g_json_arr[i][1];
    span.style.display = "block";
    div_word_match.appendChild(span);
    g_matches.push([g_json_arr[i][0], span]);
  }
  sel_match(0);
}

function sel_match(idx) {
  if (!g_matches.length) return;
  if (idx != g_sel_match)
    g_matches[g_sel_match][1].style.removeProperty('background-color');
  g_matches[idx][1].style["background-color"] = "coral";
  g_sel_match = idx;
}

function do_special_key(kc, inp_search, type) {
  var idx;
  if (!g_matches.length) return false;
  switch(kc) {
    case 13: /* newline */
      sel_insert(g_matches[g_sel_match][1].textContent, inp_search); /* todo: validate */
      hide_help(type);
      break;
    case 27: /* escape */
      hide_help(type);
      break;
    case 38: /* up */
      idx = g_sel_match - 1;
      if (idx < 0) idx = g_matches.length - 1;
      sel_match(idx);
      break;
    case 40: /* down */
      idx = g_sel_match + 1;
      if (idx >= g_matches.length) idx = 0;
      sel_match(idx);
      break;
  }
}

function sel_insert(word, inp_search) {
  var str = inp_search.value;
  var selstart = inp_search.selectionStart;
  
  var i, from = -1, until = str.length;
  for (i = selstart - 1; i >= 0; i--) {
    if (" -.'".indexOf(str[i]) != -1) { from = i; break;}
  }
  for (i = selstart; i < str.length; i++) {
    if (" -.'".indexOf(str[i]) != -1) { until = i; break;}
  }
  inp_search.value = str.substr(0,from + 1) + word + str.substr(until);
}

function get_sh_info() {
  parse_words();
  var data = new FormData();
  data.append( "words", JSON.stringify(g_words));
  data.append( "word_data", JSON.stringify(g_word_data));
  var url = "/w/extensions/VaniSearch/src/vs_util.php?type=sh_info";
  fetch(url, {method: "POST", body: data})
    .then((resp) => resp.json())
    .then((data) => {
      g_word_data = data;
      display_words();
    })
    .catch(function(error) {
    });
}

function parse_words() {
  var words = [], str = search_tnew.value, bnd = false, from = -1;
  for (var i = 0; i < str.length; i++) {
    if (" -.'".indexOf(str[i]) != -1) {
      if (!bnd && (from >= 0)) {
        words.push(str.substr(from,i - from));
        from = -1;
      }
      bnd = true;
    }
    else {
      if ((i == 0) || bnd) from = i;
      if ((i == str.length - 1) && (from >= 0)) {
        words.push(str.substr(from,i - from + 1));
      }
      bnd = false;
    }
  }
  g_words = words;
}

function display_words() {
  div_sh_info.innerHTML = "";
  for (var w = 0; w < g_word_data.length; w++) {
    var rec = g_word_data[w];
    div_sh_info.innerHTML += 
      rec.dict_text + " - " + 
      rec.dict_freq + " - " + 
      rec.match_contains + "<br>";
  }
}