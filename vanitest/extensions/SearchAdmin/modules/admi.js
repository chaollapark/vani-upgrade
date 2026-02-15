function init_modal() {
  var but;
  
  spn_modal_close.onclick = () => { hide_modal() };
  window.onclick = (event)=> {
    if (event.target == div_modal) hide_modal();
  }
}

function dsp_vanis(focus) {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = div_master, panel = "master", view = "vani";
  
  tbl = document.createElement("table");
  tbl.id = "tbl_vanis";
  tbl.classList = view;
  thead = document.createElement("thead");
  
  arr = [
    ["#","50px",0],
    ["Id","50px",1,0],
    ["Code","60px",1,1],
    ["Vani","350px",1,2],
    ["Pages","60px",1,3],
    ["Sel.","40px",0]
  ];
    
  gen_thead(thead, arr, panel, view); 
  tbody = document.createElement("tbody"); 
  fill_tbody_vani(tbody);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);

  if (focus) row = document.getElementById(focus);
  if (row == null) row = tbody.firstElementChild;
  row.scrollIntoView({block: "center"});
  row.click();
}

function dsp_categories(focus) {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = div_master, panel = "master", view = "catg";
  
  tbl = document.createElement("table");
  tbl.id = "tbl_categories";
  tbl.classList = view;
  thead = document.createElement("thead");
  
  arr = [
    ["#","50px",0],
    ["Id","50px",1,0],
    ["Category Page","350px",1,1],
    ["Type","100px",1,2],
    ["Sel.","40px",0]
  ];
    
  gen_thead(thead, arr, panel, view); 
  tbody = document.createElement("tbody"); 
  fill_tbody_catg(tbody);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);

  if (focus) row = document.getElementById(focus);
  if (row == null) row = tbody.firstElementChild;
  row.scrollIntoView({block: "center"});
  row.click();
}

function dsp_filt_pages() {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = div_detail, panel = "detail", view = "vani";
  
  tbl = document.createElement("table");
  tbl.id = "tbl_filt_pages";
  thead = document.createElement("thead");
  arr = [["#","60px",0],["Id","60px",1,0],["Title","350px",1,1]];
  
  gen_thead(thead, arr, panel, view); 
  tbody = document.createElement("tbody"); 
  fill_tbody_page(tbody);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);
  show_navig();
}

function fill_tbody_vani(tbody) {
  var vanis, idx, row, type, sort;
  var panel = "master", view = "vani";
  
  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
  vanis = Object.keys(g_vanis);
  
  type = g_sort_options[panel][view][g_sort_index[panel][view]].type;
  sort = g_sort_options[panel][view][g_sort_index[panel][view]].sort;
  if (type == "id") {
    if (sort == 0) vanis.sort(function(a, b){ return a-b });
    else vanis.sort(function(a, b){ return b-a });
  } else if (type == "name" || type == "code") {
    if (sort == 0) vanis.sort(function(a, b){ if (g_vanis[a][type] < g_vanis[b][type]) return -1; if (g_vanis[a][type] > g_vanis[b][type]) return 1; return 0});
    else vanis.sort(function(a, b){if (g_vanis[a][type] < g_vanis[b][type]) return 1; if (g_vanis[a][type] > g_vanis[b][type]) return -1; return 0});      
  } else if (type == "tot_pages") {
    if (sort == 0) vanis.sort(function(a, b){ return g_vanis[a][type]-g_vanis[b][type] });
    else vanis.sort(function(a, b){ return g_vanis[b][type]-g_vanis[a][type] });
  } 
  
  idx = 0;
  vanis.forEach(id => {
    let vani = g_vanis[id];
    idx++;
    let row = document.createElement("tr");
    row.id = "v_" + id; 
    row.onclick = (event) => handle_row_click(panel, event, row, vani.name);
    add_cell(row, idx, "number_cel", "50px");
    add_cell(row, id, "number_cel", "50px");
    add_cell(row, vani.code, "", "60px");
    add_cell(row, vani.name, "", "350px");
    add_cell(row, vani.tot_pages, "number_cel", "60px");
    add_checkbox("vani", row, id, "40px");

    tbody.appendChild(row);
  });
}

function fill_tbody_catg(tbody) {
  var tbody, categories, idx, row, type, sort;
  var panel = "master", view = "catg";
  
  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
  categories = Object.keys(g_categories);
  
  type = g_sort_options[panel][view][g_sort_index[panel][view]].type;
  sort = g_sort_options[panel][view][g_sort_index[panel][view]].sort;
  if (type == "id") {
    if (sort == 0) categories.sort(function(a, b){ return a-b });
    else categories.sort(function(a, b){ return b-a });
  } else if (type == "name" || type == "type") {
    if (sort == 0) categories.sort(function(a, b){ if (g_categories[a][type] < g_categories[b][type]) return -1; if (g_categories[a][type] > g_categories[b][type]) return 1; return 0});
    else categories.sort(function(a, b){if (g_categories[a][type] < g_categories[b][type]) return 1; if (g_categories[a][type] > g_categories[b][type]) return -1; return 0});      
  } else if (type == "tot_pages" || type == "tot_edits" || type == "rev_last") {
    if (sort == 0) categories.sort(function(a, b){ return g_categories[a][type]-g_categories[b][type] });
    else categories.sort(function(a, b){ return g_categories[b][type]-g_categories[a][type] });
  } 
  
  idx = 0;
  categories.forEach(id => {
    let catg = g_categories[id];
    idx++;
    let row = document.createElement("tr");
    row.id = "c_" + id; 
    row.onclick = (event) => handle_row_click(panel, event, row, catg.name);
    add_cell(row, idx, "number_cel", "50px");
    add_cell(row, id, "number_cel", "50px");
//    add_cell(row, catg.name, "", "350px");
    add_link(row, "Category:", catg.name, "", "350px");
    add_cell(row, catg.type, "", "100px");
    add_checkbox("catg", row, id, "40px");

    tbody.appendChild(row);
  });
}

function fill_tbody_page(tbody) {
  var pages, page, idx, row, type, ofs, sort;
  var panel = "detail"; view = "vani";
  
  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
  pages = Object.keys(g_filt_pages);
  
  type = g_sort_options[panel][view][g_sort_index[panel][view]].type;
  sort = g_sort_options[panel][view][g_sort_index[panel][view]].sort;
  if (type == "id") {
    if (sort == 0) pages.sort(function(a, b){ return a-b });
    else pages.sort(function(a, b){ return b-a });
  } else if (type == "name") {
    if (sort == 0) pages.sort(function(a, b){ if (g_filt_pages[a].title < g_filt_pages[b].title) return -1; if (g_filt_pages[a].title > g_filt_pages[b].title) return 1; return 0});
    else pages.sort(function(a, b){if (g_filt_pages[a].title < g_filt_pages[b].title) return 1; if (g_filt_pages[a].title > g_filt_pages[b].title) return -1; return 0});      
  }
  
  ofs = (Math.max(g_cur_page - 1,0) * sel_rpp.value);
  idx = ofs;
  pages.forEach(id => {
    page = g_filt_pages[id];
    idx++;
    let row = document.createElement("tr");
    row.id = "p_" + id;
    add_cell(row, idx, "number_cel", "60px");
    add_cell(row, id, "number_cel", "60px");
    add_link(row, "", page.title, "", "350px");
    tbody.appendChild(row);
  });
}

function gen_buttons_filter(parent) {
  var div, but;

  div = create_div("","border_block",{'display':'inline-block','vertical-align':'top'},[]);
  Object.keys(g_buttons_filter).forEach(id => {
    but = cre_button(
      id,
      g_buttons_filter[id].caption,
      g_buttons_filter[id].balloon,
      "right",
      g_buttons_filter[id].func);
    div.appendChild(but);
  });
  parent.appendChild(div);
}

function cre_button(id, caption, balloon, float, func) {
  var but;
  but = document.createElement("button");
  if (id) but.id = id;
  but.textContent = caption;
  but.title = balloon;
  but.style.float = float;
  but.onclick = func;
  
  return but;
}

function set_buttons_filter(view) {
  var display;
  
  Object.keys(g_buttons_filter).forEach(id => {
    display = (g_buttons_filter[id].views.includes(view) ? "block" : "none");
    but = document.getElementById(id);
    but.style.display = display;
  });
}

function help_row(body, topic, help) {
  var tr, td;
  tr = document.createElement("tr");
  tr.style.display = "table-row"; /* overrule CSS setting */
  td = document.createElement("td");
  td.textContent = topic;
  tr.appendChild(td);
  td = document.createElement("td");
  td.textContent = help;
  tr.appendChild(td);
  body.appendChild(tr);
}

function show_modal(title, func) {
  var but, div;
  
  div_modal.style.display = "block";
  spn_modal_title.textContent = title;
  div_modal_footer.innerHTML = "";
  if (func) {
    but = cre_button("","Submit", title, "none", func);
    div_modal_footer.appendChild(but);
    div = document.createElement("div");
    div.id = "div_modal_error";
    div_modal_footer.appendChild(div);
  }
}

function hide_modal() {
  div_modal.style.display = "none";
}

function toggle_sort(idx, obj, panel, view) {
  var sort, tbody;
  var classes = ["fa-arrow-up","fa-arrow-down"];
  
  if (g_sort_index[panel][view] == idx) {
    sort = g_sort_options[panel][view][idx].sort;
    sort = 1 - sort;
    g_sort_options[panel][view][idx].sort = sort;
    obj.classList.replace(classes[1 - sort],classes[sort]);
  }
  else {
    g_sort_options[panel][view][g_sort_index[panel][view]].elem.classList.toggle("hidden");
    g_sort_options[panel][view][idx].elem.classList.toggle("hidden");
  }
  g_sort_index[panel][view] = idx;
  
  tbody = g_tbody[panel];
  if (panel == "detail") {
    get_filt_pages(true);
  } else if (panel == "master") { 
    if (view == "vani") fill_tbody_vani(tbody);
    else if (view == "catg") fill_tbody_catg(tbody);
    g_sel_row = document.getElementById(g_focus[view]);
    g_sel_row.scrollIntoView({block: "center"});
    g_sel_row.classList.add("selrow");
  } else if (panel == "dict") { 
    g_nav_data["dict"].cur_page = 1;
    g_tabs["main"].sheets["dict"].func.call(null,g_diff);
  } else if (view == "catg_words") { 
    g_nav_data["catg"].cur_page = 1;
    g_tabs["match"].sheets["catg"].func.call(null,g_diff);
  } else if (view == "page_words") { 
    g_nav_data["page"].cur_page = 1;
    g_tabs["match"].sheets["page"].func.call(null,g_diff);
  } else if (view == "text_words") { 
    g_nav_data["text"].cur_page = 1;
    g_tabs["match"].sheets["text"].func.call(null,g_diff);
  }
}

function gen_div_navig(parent) {
  var spn1, spn2, spn3, spn4, lab1, lab2, txt3, div1, div2;
  
  div1 = document.createElement("div");
  gen_sel_rpp(div1);
  parent.appendChild(div1);

  spn1 = document.createElement("span");
  spn1.style.verticalAlign = "middle";
  lab1 = document.createElement("label");
  lab1.textContent = " Total records: ";
  spn2 = document.createElement("span");
  spn2.id = "spn_tot_records";
  lab2 = document.createElement("label");
  lab2.textContent = "  Page: ";
  spn3 = document.createElement("span");
  spn3.id = "spn_cur_page";
  txt3 = document.createTextNode("/");
  spn4 = document.createElement("span");
  spn4.id = "spn_tot_pages";
  
  spn1.appendChild(lab1);
  spn1.appendChild(spn2);
  spn1.appendChild(lab2);
  spn1.appendChild(spn3);
  spn1.appendChild(txt3);
  spn1.appendChild(spn4);
  
  div1 = document.createElement("div");
  gen_inp_filter(div1,"inp_filt_detail",() => get_filt_pages(true));
  
  div2 = create_div("","div_buttons",null,[]);
  gen_nav_buttons(div2, "main", "filter"); /* todo */

  parent.appendChild(div1);
  parent.appendChild(spn1);
  parent.appendChild(div2);
}

function gen_nav_buttons(div, tabname, sheetname) {
  var but, i;
  
  cre_nav_button(div, "Previous", () => nav_prev(tabname, sheetname), "fa fa-angle-left");
  cre_nav_button(div, "Next", () => nav_next(tabname, sheetname), "fa fa-angle-right");
  cre_nav_button(div, "First", () => nav_first(tabname, sheetname), "fa fa-angle-double-left");
  cre_nav_button(div, "Last", () => nav_last(tabname, sheetname), "fa fa-angle-double-right");
}

function cre_nav_button(div, title, func, cls) {
  var but, i;
  
  but = document.createElement("button");
  but.title = title;
  but.style.verticalAlign = "bottom";
  but.onclick = func;
  i = document.createElement("i");
  i.classList = cls;
  but.appendChild(i);
  div.appendChild(but);
}

function show_navig() { 
  right_panel.style.display = "inline-block";
}

function hide_navig() {
  right_panel.style.display = "none";
}

function gen_sel_rpp(parent) {
  var div, sel, lab, opt, numbers = ["25","50","100","250","500","1000"];

  div = document.createElement("div");
  sel = document.createElement("select");
  sel.id = "sel_rpp"; 
  sel.classList = "arrow";
  sel.onchange = () => g_sel_row.click();

  numbers.forEach(number => {
    opt = document.createElement("option");
    opt.value = number; opt.textContent = number;
    sel.appendChild(opt);
  });
  sel.value = "250";

  lab = document.createElement("label");
  lab.textContent = "Records per page: ";

  div.appendChild(lab);
  div.appendChild(sel);
  parent.appendChild(div);
}

function dsp_navig() { 
  var tot_records, cur_page, tot_pages;
  
  tot_records = new Intl.NumberFormat('en-US', {style: 'decimal'}).format(g_tot_records);
  spn_tot_records.textContent = tot_records;
  cur_page = new Intl.NumberFormat('en-US', {style: 'decimal'}).format(g_cur_page);
  spn_cur_page.textContent = cur_page;
  tot_pages = new Intl.NumberFormat('en-US', {style: 'decimal'}).format(g_tot_pages);
  spn_tot_pages.textContent = tot_pages;
}

function nav_prev(tabname, sheetname) {
  if (tabname == "main" && sheetname != "dict") {
    if (g_cur_page <= 1) return;
    g_cur_page--;
  } else {
    if (g_nav_data[sheetname].cur_page <= 1) return;
    g_nav_data[sheetname].cur_page--;
  }
  //get_filt_pages(false);
  g_tabs[tabname].sheets[sheetname].func.call(null,g_diff);
}

function nav_next(tabname, sheetname) {
  if (tabname == "main" && sheetname != "dict") {
    if (g_cur_page == g_tot_pages) return;
    g_cur_page++;
  } else {
    if (g_nav_data[sheetname].cur_page == g_nav_data[sheetname].tot_pages) return;
    g_nav_data[sheetname].cur_page++;
  }
  //get_filt_pages(false);
  g_tabs[tabname].sheets[sheetname].func.call(null,g_diff);
}

function nav_first(tabname, sheetname) {
  if (tabname == "main" && sheetname != "dict") {
    if (g_cur_page <= 1) return;
    g_cur_page = 1;
  } else {
    if (g_nav_data[sheetname].cur_page <= 1) return;
    g_nav_data[sheetname].cur_page = 1;
  }
  //get_filt_pages(false);
  g_tabs[tabname].sheets[sheetname].func.call(null,g_diff);
}

function nav_last(tabname, sheetname) {
  if (tabname == "main" && sheetname != "dict") {
    if (g_cur_page == g_tot_pages) return;
    g_cur_page = g_tot_pages;
  } else {
    if (g_nav_data[sheetname].cur_page == g_nav_data[sheetname].tot_pages) return;
    g_nav_data[sheetname].cur_page = g_nav_data[sheetname].tot_pages;
  }
  //get_filt_pages(false);
  g_tabs[tabname].sheets[sheetname].func.call(null,g_diff);
}
