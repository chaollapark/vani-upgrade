g_namespaces = {
  0: "",
  1: "Talk:",
  2: "User:",
  3: "User_talk:",
  4: "Project:",
  5: "Project_talk:",
  6: "File:",
  7: "File talk:",
  8: "MediaWiki:",
  9: "MediaWiki_talk:",
 10: "Template:",
 11: "Template_talk:",
 12: "Help:",
 13: "Help_talk:",
 14: "Category:",
 15: "Category_talk:"
};

function init_modal() {
  var but;
  
  spn_modal_close.onclick = () => { hide_modal() };
  window.onclick = (event)=> {
    if (event.target == div_modal) hide_modal();
  }
}

function dsp_users(view,focus) {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = div_master, panel = "user";
  
  tbl = document.createElement("table");
  tbl.id = "tbl_users";
  tbl.classList = view;
  thead = document.createElement("thead");
  if (view == "page") {
    arr = [
      ["#","50px",0],
      ["Id","50px",1,0],
      ["User","160px",1,1],
      ["Pages","60px",1,2],
      ["Edits","60px",1,3],
      ["Last","80px",1,4]
    ];
  } else if (view == "detail") {
    arr = [
      ["#","50px",0],
      ["Id","50px",1,0],
      ["User","160px",1,1],
      ["Real name","280px",1,5],
      ["E-mail","280px",1,6],
      ["Reg.","80px",1,7],
      ["Pages","60px",1,2],
      ["Edits","60px",1,3],
      ["Last","80px",1,4]
    ];
  }

  gen_thead(thead, arr, panel); 
  tbody = document.createElement("tbody"); 
  fill_tbody_user(tbody,view);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);

  row = document.getElementById(focus);
  if (row == null) row = tbody.firstElementChild;
  row.scrollIntoView({block: "center"});
  if (view == "detail") g_sync = false;
  row.click();
}

function dsp_pages() {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  var parent = div_detail, panel = "page";
  
  tbl = document.createElement("table");
  tbl.id = "tbl_pages";
  thead = document.createElement("thead");
  arr = [["#","60px",0],["Id","60px",1,0],["Title","320px",1,1],["Rev.","60px",1,2],["Last","80px",1,3]];
  
  gen_thead(thead, arr, panel); 
  tbody = document.createElement("tbody"); 
  fill_tbody_page(tbody);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);
  show_navig();
}

function fill_tbody_user(tbody, view) {
  var users, user, idx, row, type, sort;
  var panel = "user";
  
  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
  users = Object.keys(g_users);
  
  type = g_sort_options[panel][g_sort_index[panel]].type;
  sort = g_sort_options[panel][g_sort_index[panel]].sort;
  if (type == "id") {
    if (sort == 0) users.sort(function(a, b){ return a-b });
    else users.sort(function(a, b){ return b-a });
  } else if (type == "name" || type == "email" || type == "real" || type == "regist") {
    if (sort == 0) users.sort(function(a, b){ if (g_users[a][type] < g_users[b][type]) return -1; if (g_users[a][type] > g_users[b][type]) return 1; return 0});
    else users.sort(function(a, b){if (g_users[a][type] < g_users[b][type]) return 1; if (g_users[a][type] > g_users[b][type]) return -1; return 0});      
  } else if (type == "tot_pages" || type == "tot_edits" || type == "rev_last") {
    if (sort == 0) users.sort(function(a, b){ return g_users[a][type]-g_users[b][type] });
    else users.sort(function(a, b){ return g_users[b][type]-g_users[a][type] });
  } 
  
  idx = 0;
  users.forEach(id => {
    user = g_users[id];
    idx++;
    let row = document.createElement("tr");
    row.id = id; /* TODO: avoid confusion between page_id and user_id */
//    if (view == "page") row.onclick = (event) => handle_row_click(event, row, id);
    row.onclick = (event) => handle_row_click(event, row, id);
    add_cell(row, idx, "number_cel", "50px");
    add_cell(row, id, "number_cel", "50px");
    add_cell(row, user.name, "", "160px");
    if (view == "detail") {
      add_cell(row, user.real, "", "280px");
      add_cell(row, user.email, "", "280px");
      add_cell(row, format_time(user.regist), "", "80px");
    }
    add_cell(row, user.tot_pages, "number_cel", "60px");
    add_cell(row, user.tot_edits, "number_cel", "60px");
    add_cell(row, format_time(user.rev_last), "", "80px");
    tbody.appendChild(row);
  });
}

function fill_tbody_page(tbody) {
  var pages, page, idx, row, type, ofs, sort;
  var panel = "page";
  
  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
  pages = Object.keys(g_pages);
  
  type = g_sort_options[panel][g_sort_index[panel]].type;
  sort = g_sort_options[panel][g_sort_index[panel]].sort;
  if (type == "id") {
    if (sort == 0) pages.sort(function(a, b){ return a-b });
    else pages.sort(function(a, b){ return b-a });
  } else if (type == "title") {
    if (sort == 0) pages.sort(function(a, b){ if (g_pages[a].title < g_pages[b].title) return -1; if (g_pages[a].title > g_pages[b].title) return 1; return 0});
    else pages.sort(function(a, b){if (g_pages[a].title < g_pages[b].title) return 1; if (g_pages[a].title > g_pages[b].title) return -1; return 0});      
  } else if (type == "tot_revs") {
    if (sort == 0) pages.sort(function(a, b){ return g_pages[a].tot_revs-g_pages[b].tot_revs });
    else pages.sort(function(a, b){ return g_pages[b].tot_revs-g_pages[a].tot_revs });
  } else if (type == "rev_last") {
    if (sort == 0) pages.sort(function(a, b){ return g_pages[a].rev_last-g_pages[b].rev_last });
    else pages.sort(function(a, b){ return g_pages[b].rev_last-g_pages[a].rev_last });
  }
  
  ofs = (Math.max(g_cur_page - 1,0) * sel_rpp.value);
  idx = ofs;
  pages.forEach(id => {
    page = g_pages[id];
    idx++;
    let row = document.createElement("tr");
    row.id = id;
    //row.onclick = (event) => handle_row_click(event, row, id);
    add_cell(row, idx, "number_cel", "60px");
    add_cell(row, id, "number_cel", "60px");
    //add_cell(row, page.title, "", "320px");
    add_link(sel_petal.value, row, page.title, "", "320px");
    add_cell(row, page.tot_revs, "number_cel", "60px");
    add_cell(row, format_time(page.rev_last), "", "80px");
    tbody.appendChild(row);
  });
}

function format_time(time) {
  return time.substr(0,4) + "-" + time.substr(4,2) + "-" + time.substr(6,2);
}

function gen_div_right() {
  var div, but1, but2;

  div = document.createElement("div");

  but1 = cre_button("Refresh", "Refresh data", "right", () => get_users(g_sel_row.id,true));
  but2 = cre_button("Help", "Show help information", "right", () => show_help());
  
  div.appendChild(but2);
  div.appendChild(but1);
  div_right.appendChild(div);
}

function cre_button(text, title, float, func) {
  var but;
  but = document.createElement("button");
  but.textContent = text;
  but.title = title;
  but.style.float = float;
  if (func) but.onclick = func;
  
  return but;
}

function show_help() {
  var tbl, tbody;
  
  tbl = document.createElement("table");
  tbl.style.marginTop = "10px";
  tbody = document.createElement("tbody");
  tbody.style.display = "table-row"; /* overrule CSS setting */
  tbl.appendChild(tbody);

  help_row(tbody, "Pages", "the number of pages of existing revisions of this user");
  help_row(tbody, "Edits", "the number of edits of this user (the corresponding revisions might have been deleted)");
  help_row(tbody, "Last (user table)", "the timestamp of the latest existing revision of this user");
  help_row(tbody, "Last (page table)", "the timestamp of the latest existing revision of this page and this user");
  help_row(tbody, "Rev.", "the number of existing revisions of this page and this user");
  
  div_modal_body.innerHTML = "";
  div_modal_body.appendChild(tbl);
  show_modal("Help Information", null);
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
    but = cre_button("Submit", title, "none", func);
    div_modal_footer.appendChild(but);
    div = document.createElement("div");
    div.id = "div_modal_error";
    div_modal_footer.appendChild(div);
  }
}

function hide_modal() {
  div_modal.style.display = "none";
}

function toggle_sort(idx, obj, panel) {
  var view, sort, focus, users;
  var classes = ["fa-arrow-up","fa-arrow-down"];
  
  if (g_sort_index[panel] == idx) {
    sort = g_sort_options[panel][idx].sort;
    sort = 1 - sort;
    g_sort_options[panel][idx].sort = sort;
    obj.classList.replace(classes[1 - sort],classes[sort]);
  }
  else {
    g_sort_options[panel][g_sort_index[panel]].elem.classList.toggle("hidden");
    g_sort_options[panel][idx].elem.classList.toggle("hidden");
  }
  g_sort_index[panel] = idx;
  
  view = get_view_value();
  if (panel == "user") fill_tbody_user(g_tbody[panel],view);
//  else if (panel == "page") fill_tbody_page(g_tbody[panel]);
  else if (panel == "page") get_pages(g_sel_row.id,true);
  
  if (panel == "user" && view == "page") {
    focus = g_sel_row.id;
    row = document.getElementById(focus);
    // if (view == "user") row.scrollIntoView({block: "center"});
    g_sync = false;
    row.click();
  }
}

function gen_div_navig() {
  var spn1, spn2, spn3, spn4, lab1, lab2, txt3, div1, div2;
  
  div1 = document.createElement("div");
  gen_sel_rpp(div1);
  gen_sel_nspace(div1);
  div_navig.appendChild(div1);

  spn1 = document.createElement("span");
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
  gen_inp_filter(div1,"inp_filt_page",() => get_pages(g_sel_row.id,true));
  
  div2 = document.createElement("div");
  div2.id = "div_buttons";
  gen_nav_buttons(div2);

  div_navig.appendChild(div1);
  div_navig.appendChild(spn1);
  div_navig.appendChild(div2);
}

function gen_nav_buttons(div) {
  var but, i;
  
  cre_nav_button(div, "Previous", () => nav_prev(), "fa fa-angle-left");
  cre_nav_button(div, "Next", () => nav_next(), "fa fa-angle-right");
  cre_nav_button(div, "First", () => nav_first(), "fa fa-angle-double-left");
  cre_nav_button(div, "Last", () => nav_last(), "fa fa-angle-double-right");
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
  var diff;
  
  div_navig.style.display = "inline-block";
  diff = div_left.offsetHeight - div_navig.offsetHeight;
  div_navig.style.left = tbl_pages.offsetLeft + "px";
  div_navig.style.top = (div_left.offsetTop + diff - 1) + "px";
}

function hide_navig() {
  div_navig.style.display = "none";
}

function gen_sel_rpp(parent) {
  var div, sel, lab, opt, numbers = ["25","50","100","250","500","1000"];

  div = document.createElement("div");
  div.style.float = "left";
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

function gen_sel_nspace(parent) {
  var div, sel, lab, opt, txt, numbers = ["25","50","100","250"];

  div = document.createElement("div");
  div.style.float = "left";
  sel = document.createElement("select");
  sel.id = "sel_nspace"; 
  sel.classList = "arrow";
  sel.onchange = () => get_pages(g_sel_row.id, true);
  
  opt = document.createElement("option");
  opt.value = -1; opt.textContent = "<All>";
  sel.appendChild(opt);
  for (const [key, value] of Object.entries(g_namespaces)) {
    if (value) txt = value; else txt = "Main";
    opt = document.createElement("option");
    opt.value = key; 
    opt.textContent = 
      key.toString().padStart(2, "0") + ": " + 
      txt.replace("_"," ").replace(":","");
    sel.appendChild(opt);
  }
  sel.value = -1;
  
  lab = document.createElement("label");
  lab.textContent = "Namespace: ";

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

function nav_prev() {
  if (g_cur_page <= 1) return;
  g_cur_page--;
  get_pages(g_sel_row.id,false);
}

function nav_next() {
  if (g_cur_page == g_tot_pages) return;
  g_cur_page++;
  get_pages(g_sel_row.id,false);
}

function nav_first() {
  if (g_cur_page <= 1) return;
  g_cur_page = 1;
  get_pages(g_sel_row.id,false);
}

function nav_last() {
  if (g_cur_page == g_tot_pages) return;
  g_cur_page = g_tot_pages;
  get_pages(g_sel_row.id,false);
}
