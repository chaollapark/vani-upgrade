var g_search_data = {
  "catg": {"name":"Category", "tot_records": 0, "tot_pages": 0, "cur_page": 0, "func": do_search_titl, "params": null, "json": null},
  "page": {"name":"Page", "tot_records": 0, "tot_pages": 0, "cur_page": 0, "func": do_search_titl, "params": null, "json": null},
  "text": {"name":"Text", "tot_records": 0, "tot_pages": 0, "cur_page": 0, "func": do_search_text, "params": null, "json": null},
  "line": {"name":"Verse Line", "tot_records": 0, "tot_pages": 0, "cur_page": 0, "func": do_search_line, "params": null, "json": null},
  "syno": {"name":"Synonym", "tot_records": 0, "tot_pages": 0, "cur_page": 0, "func": do_search_syno, "params": null, "json": null, "hierarchy": null},  
  "trns": {"name":"Verse Translation", "tot_records": 0, "tot_pages": 0, "cur_page": 0, "func": do_search_trns, "params": null, "json": null}
};

var g_sort_data = {
  "catg": {"column": "titl"},
  "page": {"column": "titl"},
  "text": {"column": "titl"},
  "line": {"column": "vers"},
  "syno": {"column": "vers"},
  "trns": {"column": "vers"}
}

function search_titl(type) {
  var div_result, url, target, rpp, op, lang, vp, vq, vs, vm, ww, sort, dir;

  target = document.getElementById("inp_search_" + type).value.trim();
  if (!target || !valid_string(target,type)) return;

  display_navbars(type);
  div_result = document.getElementById("div_result_" + type);
  div_result.innerHTML = "Searching ..."
  rpp = parseInt(elem_value("sel_rpp_" + type));
  op = elem_value("sel_op_" + type);
  lang = elem_value("sel_lang_" + type)
  vp = elem_checked("chb_vp_" + type);
  vq = elem_checked("chb_vq_" + type);
  vs = elem_checked("chb_vs_" + type);
  vm = elem_checked("chb_vm_" + type);
  ww = elem_checked("chb_ww_" + type);
  ds = elem_checked("chb_ds_" + type);
  sort = g_sort_data[type].column;
  dir = (sort in g_sort_data[type] ? g_sort_data[type][sort] : 0);

  url = "/w/extensions/VaniSearch/src/vs_titl.php?func=nav_" + type;
  g_search_data[type].params = {
    "target":target, "rpp":rpp, "op":op, "lang":lang, "vp":vp, "vq":vq,
    "vs":vs, "vm":vm, "ww":ww, "ds":ds, "sort":sort, "dir":dir};
  exec_search(type, url, do_search_titl, false);
}

function search_line() {
  var div_result, target, url, rpp, op, book, part, chap, ww, ds, sort, dir;

  target = document.getElementById("search_line").value.trim();
  if (!target || !valid_string(target,"line")) return;

  display_navbars("line");
  div_result = document.getElementById("div_result_line");
  div_result.innerHTML = "Searching ..."
  rpp = parseInt(elem_value("sel_rpp_line"));
  op = elem_value("sel_op_line");
  book = elem_value("sel_book_line");
  part = elem_value("sel_part_line");
  chap = elem_value("sel_chap_line");
  ww = elem_checked("chb_ww_line");
  ds = elem_checked("chb_ds_line");
  sort = g_sort_data["line"].column;
  dir = (sort in g_sort_data["line"] ? g_sort_data["line"][sort] : 0);

  url = "/w/extensions/VaniSearch/src/vs_vers.php?func=nav_line";
  g_search_data["line"].params = {
    "target":target, "rpp":rpp, "op":op, "book":book, "part":part, "chap":chap, "ww":ww, "ds":ds, "sort": sort, "dir":dir};
  exec_search("line", url, do_search_line, false);
}

function search_trns() {
  var div_result, target, url, rpp, op, book, ww, ds, sort, dir;

  target = document.getElementById("search_trns").value.trim();
  if (!target || !valid_string(target,"trns")) return;

  display_navbars("trns");
  div_result = document.getElementById("div_result_trns");
  div_result.innerHTML = "Searching ..."
  rpp = parseInt(elem_value("sel_rpp_trns"));
  op = elem_value("sel_op_trns");
  book = elem_value("sel_book_trns");
  ww = elem_checked("chb_ww_trns");
  ds = elem_checked("chb_ds_trns");
  sort = g_sort_data["trns"].column;
  dir = (sort in g_sort_data["trns"] ? g_sort_data["trns"][sort] : 0);

  url = "/w/extensions/VaniSearch/src/vs_vers.php?func=nav_trns";
  g_search_data["trns"].params = {
    "target":target, "rpp":rpp, "op":op, "book":book, "ww":ww, "ds":ds, "sort": sort, "dir":dir};
  exec_search("trns", url, do_search_trns, false);
}

async function search_syno() {
  var div_result, sea_orig, sea_tran, url, rpp, op_orig, op_tran, book, part, chap, ww_orig, ww_tran, ds, sort, dir;

  sea_orig = document.getElementById("search_syno_orig").value.trim();
  sea_tran = document.getElementById("search_syno_tran").value.trim();
  if (!(sea_orig || sea_tran) || !valid_string(sea_orig,"syno") || !valid_string(sea_tran,"syno")) return;

  display_navbars("syno");
  div_result = document.getElementById("div_result_syno");
  div_result.innerHTML = "Searching ..."
  rpp =parseInt(elem_value("sel_rpp_syno"));
  op_orig = elem_value("sel_op_orig");
  op_tran = elem_value("sel_op_tran");
  book = parseInt(sel_book_syno.value);
  part = parseInt(sel_part_syno.value);
  chap = parseInt(sel_chap_syno.value);
  ww_orig = elem_checked("chb_ww_orig");
  ww_tran = elem_checked("chb_ww_tran");
  ds = elem_checked("chb_ds_syno");
  sort = g_sort_data["syno"].column;
  dir = (sort in g_sort_data["syno"] ? g_sort_data["syno"][sort] : 0);

  url = "/w/extensions/VaniSearch/src/vs_vers.php?func=nav_syno";
  g_search_data["syno"].params = {
    "sea_orig":sea_orig, "sea_tran":sea_tran, "rpp":rpp, "op_orig":op_orig, "op_tran":op_tran,
    "book":book, "part":part, "chap":chap, "ww_orig":ww_orig, "ww_tran":ww_tran, "ds":ds, "sort": sort, "dir":dir};
  await exec_search("syno", url, do_search_syno, false);
  g_hierarchy.displayHits();
}

function search_text() {
  var div_result, url, target, rpp, op, ww, prox, match_op, exp_limit, vanis, sort, dir;

  target = document.getElementById("inp_search_text").value.trim();
  if (!target || !valid_string(target,"text")) return;

  display_navbars("text");
  div_result = document.getElementById("div_result_text");
  div_result.innerHTML = "Searching ..."

  rpp = parseInt(elem_value("sel_rpp_text"));
  op = elem_value("sel_op_text");
  ww = elem_checked("chb_ww_text");
  prox = elem_value("spin_prox_text");
  match_op = elem_value("sel_match_op");
  exp_limit = elem_value("spin_explim_text");
  vanis = Object.keys(g_vanis).filter((vani_id) => {
    return g_vani_data[vani_id].selected == true;
  });
  sort = g_sort_data["text"].column;
  dir = (sort in g_sort_data["text"] ? g_sort_data["text"][sort] : 0);

  url = "/w/extensions/VaniSearch/src/vs_text.php?func=nav_text";
  g_search_data["text"].params = {
    "target":target, "rpp":rpp, "op":op, "ww":ww, "prox":prox, "match_op": match_op, 
    "exp_limit":exp_limit, "vanis":vanis, "sort": sort, "dir":dir};
  exec_search("text", url, do_search_text, true);
}

function do_search_titl(type) {
  var div_result, cur_page, url, ofs, lim;

  div_result = document.getElementById("div_result_" + type);
  cur_page = g_search_data[type].cur_page;
  if (cur_page == 0) {
    div_result.innerHTML = "No records";
    return;
  }
  div_result.innerHTML = "Retrieving data ...";
  sync_cur_page(type);

  ofs = g_search_data[type].json[cur_page - 1][0];
  lim = g_search_data[type].json[cur_page - 1][1];
  url = "/w/extensions/VaniSearch/src/vs_titl.php?func=" + type + "&ofs=" + ofs + "&lim=" + lim + "&page=" + cur_page;
  var formData = new FormData();
  formData.append('params', JSON.stringify(g_search_data[type].params));
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.text())
    .then((text) => {
      div_result.innerHTML = text;
      prep_headers (type);
    })
    .catch(function(error) {
    });
}

function do_search_line() {
  var div_result, cur_page, url, ofs, lim;

  div_result = document.getElementById("div_result_line");
  cur_page = g_search_data["line"].cur_page;
  if (cur_page == 0) {
    div_result.innerHTML = "No records";
    return;
  }
  div_result.innerHTML = "Retrieving data ...";
  sync_cur_page("line");

  ofs = g_search_data["line"].json[cur_page - 1][0];
  lim = g_search_data["line"].json[cur_page - 1][1];
  url = "/w/extensions/VaniSearch/src/vs_vers.php?func=line&ofs=" + ofs + "&lim=" + lim + "&page=" + cur_page;
  var formData = new FormData();
  formData.append('params', JSON.stringify(g_search_data["line"].params));
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.text())
    .then((text) => {
      div_result.innerHTML = text;
      prep_headers ("line");
    })
    .catch(function(error) {
    });
}

function do_search_trns() {
  var div_result, cur_page, url, ofs, lim;

  div_result = document.getElementById("div_result_trns");
  cur_page = g_search_data["trns"].cur_page;
  if (cur_page == 0) {
    div_result.innerHTML = "No records";
    return;
  }
  div_result.innerHTML = "Retrieving data ...";
  sync_cur_page("trns");

  ofs = g_search_data["trns"].json[cur_page - 1][0];
  lim = g_search_data["trns"].json[cur_page - 1][1];
  url = "/w/extensions/VaniSearch/src/vs_vers.php?func=trns&ofs=" + ofs + "&lim=" + lim + "&page=" + cur_page;
  var formData = new FormData();
  formData.append('params', JSON.stringify(g_search_data["trns"].params));
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.text())
    .then((text) => {
      div_result.innerHTML = text;
      prep_headers ("trns");
    })
    .catch(function(error) {
    });
}

function do_search_syno() {
  var div_result, cur_page, url, ofs, lim;

  div_result = document.getElementById("div_result_syno");
  cur_page = g_search_data["syno"].cur_page;
  if (cur_page == 0) {
    div_result.innerHTML = "No records";
    return;
  }
  div_result.innerHTML = "Retrieving data ...";
  sync_cur_page("syno");

  ofs = g_search_data["syno"].json[cur_page - 1][0];
  lim = g_search_data["syno"].json[cur_page - 1][1];
  url = "/w/extensions/VaniSearch/src/vs_vers.php?func=syno&ofs=" + ofs + "&lim=" + lim + "&page=" + cur_page;
  var formData = new FormData();
  formData.append('params', JSON.stringify(g_search_data["syno"].params));
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.text())
    .then((text) => {
      div_result.innerHTML = text;
      prep_headers ("syno");
    })
    .catch(function(error) {
    });
}

function do_search_text() {
  var div_result, cur_page, rpp, ofs, slice, url;

  div_result = document.getElementById("div_result_text");
  cur_page = g_search_data["text"].cur_page;
  if (cur_page == 0) {
    div_result.innerHTML = "No records";
    return;
  }
  div_result.innerHTML = "Retrieving data ...";
  sync_cur_page("text");

  rpp = g_search_data["text"].params["rpp"];
  ofs = (cur_page - 1) * rpp;
  slice = g_search_data["text"].json.slice(ofs, ofs + rpp);
  url = "/w/extensions/VaniSearch/src/vs_text.php?func=text";
  var formData = new FormData();
  formData.append('params', JSON.stringify(g_search_data["text"].params));
  formData.append('slice', JSON.stringify(slice));
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.text())
    .then((text) => {
      div_result.innerHTML = text;
      prep_headers ("text");
    })
    .catch(function(error) {
    });
}

async function exec_search(type,url,sea_func, analysis) {
  var extra = (!g_live_server && analysis ? "&anal=1" : "&anal=0");
  div_result = document.getElementById("div_result_" + type);
  sync_nav_data(type,{"tot_records":0, "tot_pages":0});
  var formData = new FormData();
  formData.append('params', JSON.stringify(g_search_data[type].params));
  await fetch(url + extra, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then((data) => {
      sync_nav_data(type,data);
      g_search_data[type].json = data.json;
      if ("hierarchy" in g_search_data[type]) g_search_data[type].hierarchy = data.hierarchy;
      if (data.message) display_message(type,data.message);
      if (analysis && !g_live_server) {
        div_analysis.innerHTML = data.anal;
        exec_search(type,url,sea_func,false);
      }
      else sea_func(type);
    })
    .catch(function(error) {
    });
}

function display_message(type, message) {
  var div = document.getElementById("div_message_" + type);
  div.innerHTML = message;
  div.classList.remove("hidden");
}

function sync_nav_data(type,data) {
  var parent, elems, cur_page, i;

  parent = g_tabs["main"].sheets[type].content;
  cur_page = Math.min(1,data.tot_pages);
  g_search_data[type].tot_records = data.tot_records;
  g_search_data[type].tot_pages = data.tot_pages;
  g_search_data[type].cur_page = cur_page;

  elems = parent.getElementsByClassName("tot_records");
  for (i = 0; i < elems.length; i++) {
    elems[i].textContent = data.tot_records;
  }
  elems = parent.getElementsByClassName("cur_page");
  for (i = 0; i < elems.length; i++) {
    elems[i].textContent = cur_page;
  }
  elems = parent.getElementsByClassName("tot_pages");
  for (i = 0; i < elems.length; i++) {
    elems[i].textContent = "/" + data.tot_pages;
  }
}

function prep_headers(type) {
  var icon, cls;
  var classes = ["fa fa-arrow-up sort_icon","fa fa-arrow-down sort_icon"];
  var headers = g_tabs["main"].sheets[type].content.getElementsByClassName("sortable");

  for(var i = 0; i < headers.length; i++)
  { /* add tooltip text */
    headers[i].title = "Click to sort on this column";
    /* add sort icon */
    let sort = headers[i].id.split("_")[1];
    if (!(sort in g_sort_data[type])) g_sort_data[type][sort] = 0;
    if (g_sort_data[type].column == sort) {
      cls = classes[g_sort_data[type][sort]];
      icon = create_icon(cls, "", null);
      headers[i].appendChild(icon);
    }

    headers[i].onclick = () => {
      if (g_sort_data[type].column == sort)
        g_sort_data[type][sort] = 1 - g_sort_data[type][sort];
      g_sort_data[type].column = sort;
      if (type == "text") search_text();
      else if (type == "line") search_line();
      else if (type == "syno") search_syno();
      else if (type == "trns") search_trns();
      else search_titl(type);
    };
  }
}

function sync_cur_page(type) {
  var parent, elems, cur_page, i;

  parent = g_tabs["main"].sheets[type].content;
  cur_page = g_search_data[type].cur_page;
  elems = parent.getElementsByClassName("cur_page");
  for (i = 0; i < elems.length; i++) {
    elems[i].textContent = cur_page;
  }
}

function display_navbars (type) {
  var parent, navbars;

  parent =  g_tabs["main"].sheets[type].content;
  navbars = parent.getElementsByClassName("div_navig");
  for (let i = 0; i < navbars.length; i++) {
    navbars[i].classList.remove("hidden");
  }
}

function elem_value(id) {
  var elem = document.getElementById(id); return elem.value;
}

function elem_checked(id) {
  var elem = document.getElementById(id); return +elem.checked;
}

/*
function contains_illegal (str) {
//  return str.match(/['`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/`—“”‘’…]/g,'');
  return str.match(/[`~!@#$%^&*()_|+=?;:",<>\{\}\[\]\\\/`—“”‘’…]/g,'');
}
*/

function contains_illegal (str) {
// Only allow: letters, digits, spaces, hyphens and single quotes
  return /[^\p{L}\p{N} '\-]/u.test(str);
}

function wrong_hyphen (str) {
  return str.match(/^-|-$/);
}

function valid_string (str, type) {
  if (contains_illegal(str)) {
    display_message(type,"This search pattern contains illegal characters. Only alphanumeric, space, hyphen and single quote allowed.");
    return false;
  }
  if (wrong_hyphen(str)) {
    var e = document.getElementById("div_message_" + type);
    e.innerHTML = "Leading or trailing hyphens are not allowed."
    return false;
  }
  return true;
}

function change_op (name, type) {
  var sel = document.getElementById("sel_op_" + name);
  sel.title = sel.options[sel.selectedIndex].title;
  clear_result(type);

  if (type == "text") {
    if (sel.value == "contains") { chb_ww_text.checked = true; chb_ww_text.disabled = true; }
    else if (sel.value == "contains_all") { chb_ww_text.disabled = false; }
    chb_ww_text.onchange();
  }
}

function change_rpp(type) {
  var rpp, tot_records, tot_pages;
  rpp = parseInt(elem_value("sel_rpp_" + type));
  tot_records = g_search_data[type].tot_records;
  tot_pages = Math.ceil(tot_records / rpp);
  sync_nav_data(type,{"tot_records":tot_records, "tot_pages":tot_pages});
  g_search_data[type].params["rpp"] = rpp;
  g_search_data[type].cur_page = 1;
  g_search_data[type].func(type);
}

function clear_result(type) {
  var parent, navbars, div_message, div_result;
  /* hide navigation bars and reset values */
  parent =  g_tabs["main"].sheets[type].content;
  navbars = parent.getElementsByClassName("div_navig");
  for (let i = 0; i < navbars.length; i++) {
    navbars[i].classList.add("hidden");
  }
  div_message = document.getElementById("div_message_" + type);
  div_message.classList.add("hidden");
  div_result = document.getElementById("div_result_" + type);
  div_result.innerHTML = "";
  div_syno_right.innerHTML = "";
}

function book_change(type) {
  clear_result(type);
  let sel = document.getElementById(`sel_book_${type}`);
  if (sel.value == 0) {
    show_content_unit(`sel_part_${type}`,false);
    show_content_unit(`sel_chap_${type}`,false);
  }
  else {
    let parts = get_book_parts(sel.value);
    let has_parts = Object.keys(parts).length > 0;
    let has_chaps = false;
    if (has_parts) {
      prep_sel(`sel_part_${type}`,parts);
      set_part_label(sel.value,type);
    }
    else {
      let chaps = get_book_chaps(sel.value);
      has_chaps = Object.keys(chaps).length > 0;
      if (has_chaps) prep_sel(`sel_chap_${type}`,chaps);
    }
    show_content_unit(`sel_part_${type}`,has_parts);
    show_content_unit(`sel_chap_${type}`,has_chaps);
  }
}

function part_change(type) {
  clear_result(type);
  let sel = document.getElementById(`sel_part_${type}`);
  if (sel.value == 0) {
    show_content_unit(`sel_chap_${type}`,false);
  }
  else {
    let chaps = get_part_chaps(sel.value);
    has_chaps = Object.keys(chaps).length > 0;
    if (has_chaps) prep_sel(`sel_chap_${type}`,chaps);
    show_content_unit(`sel_chap_${type}`,has_chaps);
  }
}

function prep_sel(id,parts) {
  let sel = document.getElementById(id);
  while (sel.options.length > 0) sel.remove(0);
  let opt = create_opt("All","0","",false);
  sel.appendChild(opt);
  Object.keys(parts).forEach(key => {
    let option = parts[key];
    opt = create_opt(option.name,key,"",false);
    sel.appendChild(opt);
  });
}
    
function get_book_parts(book_id) {
  let book_parts = {};
  for (let part_id in g_parts) {
    let part = g_parts[part_id];
    if (part.book_id == book_id) book_parts[part_id] = part;
  }
  return book_parts;
}

function get_book_chaps(book_id) {
  let book_chaps = {};
  for (let chap_id in g_chaps) {
    let chap = g_chaps[chap_id];
    if (chap.book_id == book_id) book_chaps[chap_id] = chap;
  }
  return book_chaps;
}

function get_part_chaps(part_id) {
  let part_chaps = {};
  for (let chap_id in g_chaps) {
    let chap = g_chaps[chap_id];
    if (chap.part_id == part_id) part_chaps[chap_id] = chap;
  }
  return part_chaps;
}

function show_content_unit(id,show) {
  let sel = document.getElementById(id);
  let unit = sel.parentElement;
  sel.value = 0;
  if (show && unit.classList.contains("hidden")) unit.classList.remove("hidden");
  if (!show && !unit.classList.contains("hidden")) unit.classList.add("hidden");
}

function set_part_label(book_id,type) {
  let labels = {2: "Canto", 3: "Lila"};
  let sel = document.getElementById(`sel_part_${type}`);
  sel.previousSibling.textContent = labels[book_id];
}

function next_page(type) {
  if (g_search_data[type].cur_page == g_search_data[type].tot_pages) return;
  g_search_data[type].cur_page += 1;
  g_search_data[type].func(type);
}

function prev_page(type) {
  if (g_search_data[type].cur_page == 1) return;
  g_search_data[type].cur_page -= 1;
  g_search_data[type].func(type);
}

function last_page(type) {
  if (g_search_data[type].cur_page == g_search_data[type].tot_pages) return;
  g_search_data[type].cur_page = g_search_data[type].tot_pages;
  g_search_data[type].func(type);
}

function first_page(type) {
  if (g_search_data[type].cur_page == 1) return;
  g_search_data[type].cur_page = 1;
  g_search_data[type].func(type);
}