function create_div(id, cls, rules, children) {
  var div = document.createElement("div");
  if (id) div.id = id;
  if (cls) div.classList = cls;
  if (rules) Object.assign(div.style, rules);
  children.forEach(child => {if (child) div.appendChild(child)});
  return div;
}

function create_btn(id, caption, cls, rules, func) {
  var btn = document.createElement("button");
  if (id) btn.id = id;
  btn.textContent = caption;
  if (cls) btn.classList = cls;
  btn.onclick = func;
  if (rules) Object.assign(btn.style, rules);
  return btn;
}

function create_span(id, text, cls) {
  var span = document.createElement("span");
  if (id) span.id = id;
  span.textContent = text;
  if (cls) span.classList = cls;
  return span;
}

function create_tab(tabname, current, rules, subtabs) {
  var tab, div1, div2, btn, id, cls, func, is_current;
  tab = g_tabs[tabname];
  tab.current = current;
  tab.elem = create_div("div_tab_" + tabname, "div_tab", rules, []);
  div1 = create_div("","tabs_container",null,[]);
  tab.elem.appendChild(div1);

  Object.keys(tab.sheets).forEach(sheetname => {
    let sheet = tab.sheets[sheetname];
    is_current = (sheetname == current);

    /* tab button */
    id = "tab_btn_" + sheetname;
    cls = "tab_button" + (is_current ? " active" : "");
    btn = create_btn(id, sheet.caption, cls, null, () => {tab_select(tabname, sheetname)});
    sheet.button = btn;
    div1.appendChild(btn);

    /* sheet content*/
    id = "tab_div_" + sheetname;
    cls = "sheet_content" + (is_current ? " active" : "") + (subtabs.includes(sheetname) ? " subtab": "");
    div2 = create_div(id, cls, null, []);
    sheet.content = div2;
    tab.elem.appendChild(div2);
  });
  
  return tab.elem;
}

function tab_select(tabname, sheetname) {
  var current, sheets;
  
  current = g_tabs[tabname].current;
  if (current == sheetname) return;
  sheets = g_tabs[tabname].sheets;
  if (current) {
    sheets[current].button.classList.toggle("active");
    sheets[current].content.classList.toggle("active");
  }
  sheets[sheetname].button.classList.toggle("active");
  sheets[sheetname].content.classList.toggle("active");
  g_tabs[tabname].current = sheetname;
  
  /* page title */
  var elem, arr, tab, title;
  elem = document.getElementById("firstHeading");
  arr = elem.textContent.split(":");
  if (g_tabs[tabname].parent) {
    tab = g_tabs[g_tabs[tabname].parent];
    title = (g_tabs[tabname].parent ? tab.sheets[tab.current].caption + ": " : "") + sheets[sheetname].caption;
  }
  else {
    title = sheets[sheetname].caption;
    if (sheetname in g_tabs) {
      tab = g_tabs[sheetname];
      title += ": " + tab.sheets[tab.current].caption;
    }
  }
  elem.textContent = arr[0] + ": " + title;
  
  /* activate content */
  if (sheetname in g_tabs) tab = g_tabs[sheetname];
  else tab = g_tabs[tabname];
  if (!(tab.sheets[tab.current].loaded)) {
    tab.sheets[tab.current].func.call();
    tab.sheets[tab.current].loaded = true;
  }
}

async function get_petals() {
  var url = "/w/extensions/SearchAdmin/src/util.php?func=get_petals";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_petals = data; 
    })
    .catch(function(error) {
    });
}

async function get_languages() {
  var url = "/w/extensions/SearchAdmin/src/util.php?func=get_languages";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_languages = data; 
    })
    .catch(function(error) {
    });
}

function gen_sel_petl(parent, tabname, type) {
  var sel, lab, opt, petals;

  sel = document.createElement("select");
  sel.id = "sel_petl_" + type; 
  sel.classList = "arrow";
  sel.onchange = sel.onchange = g_tabs[tabname].sheets[type].func;

  opt = document.createElement("option");
  opt.value = 0; opt.textContent = "All";
  sel.appendChild(opt);

  petals = Object.keys(g_petals);
  petals.forEach(id => {
    let petal = g_petals[id];
    opt = document.createElement("option");
    opt.value = id; 
    opt.textContent = petal.name.charAt(0).toUpperCase() + petal.name.slice(1);
    sel.appendChild(opt);
  });

  lab = document.createElement("label");
  lab.textContent = "Petal: ";

  parent.appendChild(lab);
  parent.appendChild(sel);
}

function gen_sel_lang(parent, tabname, type) {
  var sel, lab, opt, petals;

  sel = document.createElement("select");
  sel.id = "sel_lang_" + type; 
  sel.classList = "arrow";
  sel.onchange = g_tabs[tabname].sheets[type].func;

  opt = document.createElement("option");
  opt.value = 0; opt.textContent = "All";
  sel.appendChild(opt);

  languages = Object.keys(g_languages);
  languages.sort(function(a, b) {
    if (g_languages[a].name < g_languages[b].name) return -1; if (g_languages[a].name > g_languages[b].name) return 1; return 0;
  });
  languages.forEach(id => {
    let language = g_languages[id];
    opt = document.createElement("option");
    opt.value = id; 
    opt.textContent = language.name;
    sel.appendChild(opt);
  });

  lab = document.createElement("label");
  lab.textContent = "Language: ";

  parent.appendChild(lab);
  parent.appendChild(sel);
}

function gen_sheet_match() {
  var div_content, div_tab;

  div_content = g_tabs["main"].sheets["match"].content;
  div_tab = create_tab("match","catg",null,[]);
  div_content.appendChild(div_tab);
  
  /* catg words */
  var div_catg, div_panel, div_table;
  div_catg = g_tabs["match"].sheets["catg"].content;
  div_panel = create_match_panel("match", "catg");
  div_table = create_div("div_catg_table","div_match_table",null,[]);
  div_catg.appendChild(div_panel);
  gen_buttons_match(div_catg,"catg_words");
  div_catg.appendChild(div_table);
  
  /* page words */
  var div_page;
  div_page = g_tabs["match"].sheets["page"].content;
  div_panel = create_match_panel("match", "page");
  div_table = create_div("div_page_table","div_match_table",null,[]);
  div_page.appendChild(div_panel);
  gen_buttons_match(div_page,"page_words");
  div_page.appendChild(div_table);
  
  /* text words */
  var div_text;
  div_text = g_tabs["match"].sheets["text"].content;
  div_panel = create_match_panel("match", "text");
  div_table = create_div("div_text_table","div_match_table",null,[]);
  div_text.appendChild(div_panel);
  gen_buttons_match(div_text,"text_words");
  div_text.appendChild(div_table);
  
  sel_petl_text.value = 3; /* vanisource */
  sel_lang_text.value = 100; /* english */
  sel_petl_text.disabled = true;
  sel_lang_text.disabled = true;
}

function gen_sheet_dict() {
  /* catg words */
  var div_dict, div_panel, div_table;
  div_dict = g_tabs["main"].sheets["dict"].content;
  div_panel = create_match_panel("main", "dict");
  div_table = create_div("div_dict_table","div_match_table",null,[]);
  div_dict.appendChild(div_panel);
  gen_buttons_match(div_dict,"dict_pages");
  div_dict.appendChild(div_table);
  
  sel_petl_dict.value = 3; /* vanisource */
  sel_lang_dict.value = 100; /* english */
  sel_petl_dict.disabled = true;
  sel_lang_dict.disabled = true;
}

function get_text_words(count) { 
  var url, ofs, petl_id, lang_id, filt, sort, asc;
  
  if (count) g_nav_data["text"].cur_page = 1;
  ofs = (g_nav_data["text"].cur_page - 1) * 100; /* todo: RPP */
  //sort = JSON.stringify(g_sort_options["detail"]["vani"][g_sort_index["detail"]["vani"]]);
  filt = inp_filt_text.value; /* todo: URIencode !!! */
  sort = g_sort_options["match"].text_words[g_sort_index["match"].text_words].type; 
  asc = g_sort_options["match"].text_words[g_sort_index["match"].text_words].sort;
  div_text_table.innerHTML = "Data is being retrieved ..."; /* todo */
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=get_text_words&filt=" + filt + "&ofs=" + ofs + 
    "&total=" + (count ? 0 : g_nav_data["text"].tot_records) + "&sort=" + sort + "&asc=" + asc;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_words["text"] = data.words; 
      g_nav_data["text"].tot_records = data.tot_records;
      if (data.tot_records == 0) g_nav_data["text"].cur_page = 0;
      g_nav_data["text"].tot_pages = Math.ceil(data.tot_records / 100); /* todo: RPP */
      dsp_text_words();
    })
    .catch(function(error) {
    });
}

function get_catg_words(count) { 
  var url, ofs, petl_id, lang_id, filt, sort, asc;
  
  if (count) g_nav_data["catg"].cur_page = 1;
  ofs = (g_nav_data["catg"].cur_page - 1) * 100; /* todo: RPP */
  //sort = JSON.stringify(g_sort_options["detail"]["vani"][g_sort_index["detail"]["vani"]]);
  petl_id = sel_petl_catg.value;
  lang_id = sel_lang_catg.value;
  filt = inp_filt_catg.value; /* todo: URIencode !!! */
  sort = g_sort_options["match"].catg_words[g_sort_index["match"].catg_words].type; 
  asc = g_sort_options["match"].catg_words[g_sort_index["match"].catg_words].sort;
  div_catg_table.innerHTML = "Data is being retrieved ..."; /* todo */
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=get_catg_words&petl_id=" + petl_id + 
    "&lang_id=" + lang_id + "&filt=" + filt + "&ofs=" + ofs + 
    "&total=" + (count ? 0 : g_nav_data["catg"].tot_records) + "&sort=" + sort + "&asc=" + asc;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_words["catg"] = data.words; 
      g_nav_data["catg"].tot_records = data.tot_records;
      if (data.tot_records == 0) g_nav_data["catg"].cur_page = 0;
      g_nav_data["catg"].tot_pages = Math.ceil(data.tot_records / 100); /* todo: RPP */
      dsp_catg_words();
    })
    .catch(function(error) {
    });
}

function get_page_words(count) { 
  var url, ofs, petl_id, lang_id, filt, sort, asc;
  
  if (count) g_nav_data["page"].cur_page = 1;
  ofs = (g_nav_data["page"].cur_page - 1) * 100; /* todo: RPP */
  
  petl_id = sel_petl_page.value;
  lang_id = sel_lang_page.value;
  filt = inp_filt_page.value; /* todo: URIencode !!! */
  sort = g_sort_options["match"].page_words[g_sort_index["match"].page_words].type; 
  asc = g_sort_options["match"].page_words[g_sort_index["match"].page_words].sort;
  div_page_table.innerHTML = "Data is being retrieved ..."; /* todo */
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=get_page_words&petl_id=" + petl_id + 
    "&lang_id=" + lang_id + "&filt=" + filt + "&ofs=" + ofs + 
    "&total=" + (count ? 0 : g_nav_data["page"].tot_records) + "&sort=" + sort + "&asc=" + asc;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_words["page"] = data.words;
      g_nav_data["page"].tot_records = data.tot_records;
      if (data.tot_records == 0) g_nav_data["page"].cur_page = 0;
      g_nav_data["page"].tot_pages = Math.ceil(data.tot_records / 100); /* todo: RPP */
      dsp_page_words();
    })
    .catch(function(error) {
    });
}

function get_dict_pages(count,diff=false) { 
  var url, ofs, petl_id, lang_id, filt, sort, asc;
  
  g_diff = diff;
  if (count) g_nav_data["dict"].cur_page = 1;
  ofs = (g_nav_data["dict"].cur_page - 1) * 100; /* todo: RPP */
  //sort = JSON.stringify(g_sort_options["detail"]["vani"][g_sort_index["detail"]["vani"]]);
  petl_id = sel_petl_dict.value;
  lang_id = sel_lang_dict.value;
  filt = inp_filt_dict.value; /* todo: URIencode !!! */
  sort = g_sort_options["dict"].pages[g_sort_index["dict"].pages].type; 
  asc = g_sort_options["dict"].pages[g_sort_index["dict"].pages].sort;
  div_dict_table.innerHTML = "Data is being retrieved ..."; /* todo */
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=get_dict_pages&petl_id=" + petl_id + 
    "&lang_id=" + lang_id + "&filt=" + filt + "&ofs=" + ofs + 
    "&total=" + (count ? 0 : g_nav_data["dict"].tot_records) + "&sort=" + sort + "&asc=" + asc + "&diff=" + (+diff);
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_dict_pages = data.pages;
      g_nav_data["dict"].tot_records = data.tot_records;
      if (data.tot_records == 0) g_nav_data["dict"].cur_page = 0;
      g_nav_data["dict"].tot_pages = Math.ceil(data.tot_records / 100); /* todo: RPP */
      dsp_dict_pages();
    })
    .catch(function(error) {
    });
}

function dsp_text_words() {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = document.getElementById("div_text_table");
  
  dsp_xnavig("text");
  
  tbl = document.createElement("table");
  tbl.id = "tbl_text_words";
  thead = document.createElement("thead");
  arr = [
    ["#","60px",0],
    ["Word","200px",1,0],
    ["Language","200px",1,1],
    ["Petal","150px",1,2],
    ["Freq.","70px",1,3],
  ];
  
  gen_thead(thead, arr, "match", "text_words"); 
  tbody = document.createElement("tbody"); 
  fill_tbody_word("text", tbody);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);
}

function dsp_catg_words() {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = document.getElementById("div_catg_table");
  
  dsp_xnavig("catg");
  
  tbl = document.createElement("table");
  tbl.id = "tbl_catg_words";
  thead = document.createElement("thead");
  arr = [
    ["#","60px",0],
    ["Word","200px",1,0],
    ["Language","200px",1,1],
    ["Petal","150px",1,2],
    ["Freq.","70px",1,3],
  ];
  
  gen_thead(thead, arr, "match", "catg_words"); 
  tbody = document.createElement("tbody"); 
  fill_tbody_word("catg", tbody);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);
}

function dsp_page_words() {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = document.getElementById("div_page_table");
  
  dsp_xnavig("page");
  
  tbl = document.createElement("table");
  tbl.id = "tbl_page_words";
  thead = document.createElement("thead");
  arr = [
    ["#","60px",0],
    ["Word","200px",1,0],
    ["Language","200px",1,1],
    ["Petal","150px",1,2],
    ["Freq.","70px",1,3],
  ];
  
  gen_thead(thead, arr, "match", "page_words"); 
  tbody = document.createElement("tbody"); 
  fill_tbody_word("page", tbody);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);
}

function dsp_dict_pages() {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = document.getElementById("div_dict_table");
  
  dsp_xnavig("dict");
  
  tbl = document.createElement("table");
  tbl.id = "tbl_dict_pages";
  thead = document.createElement("thead");
  arr = [
    ["#","60px",0],
    ["Id","60px",1,0],
    ["Title","350px",1,1],
    ["Status","70px",1,2],
    ["Rev. Time","150px",1,3],
    ["Pge. Time","150px",1,4],
  ];
  
  gen_thead(thead, arr, "dict", "pages"); 
  tbody = document.createElement("tbody"); 
  fill_tbody_dict(tbody);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);
}

function fill_tbody_word(type, tbody) {
  var words, word, idx, row, sorttype, sort;
  var panel = "match"; view = type + "_words";
  
  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
  words = Object.keys(g_words[type]);
  
  sorttype = g_sort_options[panel][view][g_sort_index[panel][view]].type;
  sort = g_sort_options[panel][view][g_sort_index[panel][view]].sort;
  if (sorttype == "freq") {
    if (sort == 0) words.sort(function(a, b){ return g_words[type][a].freq-g_words[type][b].freq });
    else words.sort(function(a, b){ return g_words[type][b].freq-g_words[type][a].freq });
  } else {
    if (sort == 0) words.sort(function(a, b){ if (g_words[type][a][sorttype] < g_words[type][b][sorttype]) return -1; if (g_words[type][a][sorttype] > g_words[type][b][sorttype]) return 1; return 0});
    else words.sort(function(a, b){if (g_words[type][a][sorttype] < g_words[type][b][sorttype]) return 1; if (g_words[type][a][sorttype] > g_words[type][b][sorttype]) return -1; return 0});
  }
  
  idx = (g_nav_data[type].cur_page - 1) * 100 + 1; /* todo: RPP */
  words.forEach(id => {
    word = g_words[type][id];
    let row = document.createElement("tr");
    row.id = "p_" + id;
    add_cell(row, idx, "number_cel", "60px");
    add_cell(row, word.tokn, "", "200px");
    add_cell(row, word.lang, "", "200px");
    add_cell(row, word.petl, "", "150px");
    add_cell(row, word.freq, "number_cel", "70px");
    tbody.appendChild(row);
    idx++;
  });
}

function fill_tbody_dict(tbody) {
  var pages, page, idx, row, type, sort;
  var panel = "dict"; view = "pages";
  
  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
  pages = Object.keys(g_dict_pages);
  
  type = g_sort_options[panel][view][g_sort_index[panel][view]].type;
  sort = g_sort_options[panel][view][g_sort_index[panel][view]].sort;
  if (type == "id") {
    if (sort == 0) pages.sort(function(a, b){ return a-b });
    else pages.sort(function(a, b){ return b-a });
  } else if (type == "title" || type == "rev_time" || type == "pge_time") {
    if (sort == 0) pages.sort(function(a, b){ if (g_dict_pages[a][type] < g_dict_pages[b][type]) return -1; if (g_dict_pages[a][type] > g_dict_pages[b][type]) return 1; return 0});
    else pages.sort(function(a, b){if (g_dict_pages[a][type] < g_dict_pages[b][type]) return 1; if (g_dict_pages[a][type] > g_dict_pages[b][type]) return -1; return 0});      
  } else if (type == "stat") {
    if (sort == 0) pages.sort(function(a, b){ return g_dict_pages[a][type]-g_dict_pages[b][type] });
    else pages.sort(function(a, b){ return g_dict_pages[b][type]-g_dict_pages[a][type] });
  } 

  idx = (g_nav_data["dict"].cur_page - 1) * 100 + 1; /* todo: RPP */
  pages.forEach(id => {
    page = g_dict_pages[id];
    let row = document.createElement("tr");
    row.id = "p_" + id;
    add_cell(row, idx, "number_cel", "60px");
    add_cell(row, id, "number_cel", "60px");
    add_cell(row, page.title, "", "350px");
    add_cell(row, page.stat, "", "70px");
    var x = format_time(page.rev_time);
    add_cell(row, x, "", "150px");
    x = format_time(page.pge_time);
    add_cell(row, x, "", "150px");
    tbody.appendChild(row);
    idx++;
  });
}

function format_time(time) {
  return time.substr(0,4) + "-" + time.substr(4,2) + "-" + time.substr(6,2) + " " + time.substr(8,2) + ":" + time.substr(10,2) + ":" + time.substr(12,2);
}

function set_diff_status() {
  var url;
  url = "/w/extensions/SearchAdmin/src/util.php?func=set_diff_status";
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      get_dict_pages(true,true); /* todo: check return status */
    })
    .catch(function(error) {
    });
}

function create_match_panel(tabname, type) {
  var div_panel, div_sel_petl, div_sel_lang, div_filt;
//  div_sel = create_div("div_sel_petal_" + type,"",null,[]);
  div_sel_petl = create_div("","",{'display':'inline-block'},[]);
  gen_sel_petl(div_sel_petl, tabname, type);
  div_sel_lang = create_div("","",{'display':'inline-block'},[]);
  gen_sel_lang(div_sel_lang, tabname, type);
  div_filt = create_div("","",null,[]);
  gen_inp_filter(div_filt,"inp_filt_" + type,g_tabs[tabname].sheets[type].func);
  div_panel = create_div("","border_block",null,[div_sel_petl,div_sel_lang,div_filt]);
  gen_div_xnavig(div_panel, tabname, type);
  return div_panel;
}

function gen_buttons_match(parent, view) {
  var div, buttons, but;

  div = create_div("","border_block",{'display':'inline-block','vertical-align':'top'},[]);
  buttons = Object.keys(g_buttons_match).filter((id) => { return g_buttons_match[id].views.includes(view) });
  buttons.forEach(id => {
    but = cre_button(
      id,
      g_buttons_match[id].caption,
      g_buttons_match[id].balloon,
      "right",
      g_buttons_match[id].func);
    div.appendChild(but);
  });
  parent.appendChild(div);
}


function gen_div_xnavig(parent, tabname, type) {
  var spn1, spn2, spn3, spn4, lab1, lab2, txt3, div1, div2;
  
//  div1 = document.createElement("div");
//  gen_sel_rpp(div1);
//  parent.appendChild(div1);

  spn1 = document.createElement("span");
  spn1.style.verticalAlign = "middle";
  lab1 = document.createElement("label");
  lab1.textContent = " Total records: ";
  spn2 = document.createElement("span");
  spn2.id = "spn_tot_records_" + type;
  lab2 = document.createElement("label");
  lab2.textContent = "  Page: ";
  spn3 = document.createElement("span");
  spn3.id = "spn_cur_page_" + type;
  txt3 = document.createTextNode("/");
  spn4 = document.createElement("span");
  spn4.id = "spn_tot_pages_" + type;
  
  spn1.appendChild(lab1);
  spn1.appendChild(spn2);
  spn1.appendChild(lab2);
  spn1.appendChild(spn3);
  spn1.appendChild(txt3);
  spn1.appendChild(spn4);
  
  div1 = create_div("","div_buttons",null,[]);
  gen_nav_buttons(div1, tabname, type); /* todo */

  parent.appendChild(spn1);
  parent.appendChild(div1);
}

function dsp_xnavig(type) { 
  var tot_records, cur_page, tot_pages;
  
  tot_records = g_nav_data[type].tot_records;
  document.getElementById("spn_tot_records_" + type).textContent = tot_records;
  cur_page = g_nav_data[type].cur_page;
  document.getElementById("spn_cur_page_" + type).textContent = cur_page;
  tot_pages = g_nav_data[type].tot_pages;
  document.getElementById("spn_tot_pages_" + type).textContent = tot_pages;
}
