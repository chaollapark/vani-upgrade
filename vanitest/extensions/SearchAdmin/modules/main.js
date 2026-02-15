mw.hook('wikipage.content').add( function () {
  init_main();
});

async function init_main() {
  var div_parent = document.getElementById("mw-content-text");
  
  await get_petals();
  await get_languages();
  await get_vanitypes();
  gen_tab_control(div_parent);
  gen_div_modal(div_parent);
  gen_sheet_match();
  
  init_modal();
  init_arrow();
  
  get_master(""); /* todo: only when filter tab is selected and master is not loaded yet */
  tab_select("main", "filter");
}

function gen_tab_control(parent) {
  var div_main, div_tab, sheet, div;
  
  div_tab = create_tab("main","filter",null,["match"]);
  div_main = create_div("div_main","",{'display':'inline-block'},[div_tab]);
  parent.appendChild(div_main);
  
  gen_sheet_filter();
  gen_sheet_dict();
}

function gen_sheet_filter() {
  var sheet, left, right, topleft, topright, div_master, div_detail;
  var div_config, div_sel_vtyp, div_filt_master, div3, div_navig;
  sheet = document.getElementById("tab_div_filter");
  
  div_sel_vtyp = create_div("","",null,[]);
  div_filt_master = create_div("","",null,[]);
  div3 = create_div("div_rad_view","",null,[]);

  div_config = create_div("","border_block",null,[div_sel_vtyp,div_filt_master,div3]);
  topleft = create_div("","top_section",null,[div_config]);
  gen_buttons_filter(topleft);
  
  div_master = create_div("div_master","",null,[]);
  left = create_div("left_panel","left_right",null,[topleft,div_master]);

  div_navig = create_div("","border_block",null,[]);
  gen_div_navig(div_navig)
  topright = create_div("","top_section",null,[div_navig]);
  
  div_detail = create_div("div_detail","",null,[]);
  right = create_div("right_panel","left_right",null,[topright,div_detail]);
  
  sheet.appendChild(left);
  sheet.appendChild(right);
  
//  await get_vanitypes();
  gen_sel_vanitype(div_sel_vtyp);
  gen_inp_filter(div_filt_master,"inp_filt_master",() => get_master(""));
  gen_rad_view();
}

function gen_div_modal(parent) {
  var div_modal, div_content, div_body, div_footer, span_close, span_title;
  
  span_close = create_span("spn_modal_close","X","close");
  span_title = create_span("spn_modal_title","","");
  div_body = create_div("div_modal_body","",null,[]);
  div_footer = create_div("div_modal_footer","",null,[]);
  div_content = create_div("","modal-content",null,[span_close,span_title,div_body,div_footer]);
  div_modal = create_div("div_modal","modal",null,[div_content]);
  parent.appendChild(div_modal);
}

function gen_sel_vanitype(parent) {
  var sel, lab, opt, vanitypes;

  sel = document.createElement("select");
  sel.id = "sel_vanitype"; 
  sel.classList = "arrow";
  sel.onchange = () => { 
    get_master("");
  };

  vanitypes = Object.keys(g_vanitypes);
  vanitypes.forEach(id => {
    let vanitype = g_vanitypes[id];
    opt = document.createElement("option");
    opt.value = id; opt.textContent = vanitype.name;
    sel.appendChild(opt);
  });

  lab = document.createElement("label");
  lab.textContent = "Type: ";

  parent.appendChild(lab);
  parent.appendChild(sel);
}

function gen_inp_filter(parent, id, func) {
  var lab, inp;

  inp = document.createElement("input");
  inp.id = id;
  inp.type = "text";
  inp.placeholder = "Filter";
  inp.classList = "inp_filt arrow";
  inp.onchange = func;

  lab = document.createElement("label");
  lab.textContent = "Filter: ";

  parent.appendChild(lab);
  parent.appendChild(inp);
}

function gen_rad_view() {
  var lab;
  lab = document.createElement("label");
  lab.textContent = "View: ";
  div_rad_view.appendChild(lab);
  add_rad_button("view", "vani", "Vani", true);
  add_rad_button("view", "catg", "Category", false);
}

function add_rad_button(group, value, text, checked) {
  var div, inp, lab;
  
  div = document.createElement("div");
  div.style.display = "inline-block";
  inp = document.createElement("input");
  inp.type = "radio";  
  inp.id = "rdb_" + value;
  inp.classList = "radio_input";
  inp.name = group; 
  inp.value = value; 
  inp.checked = checked;
  inp.onchange = () => get_master("");
  div.appendChild(inp);
  
  lab = document.createElement("label");
  lab.htmlFor = inp.id; 
  lab.textContent = text;
  div.appendChild(lab);
  div_rad_view.appendChild(div);
}

function get_view_value() {
  var radio, view = 0;
  radio = Array.from(div_rad_view.getElementsByTagName("input"));
  radio.forEach((but) => {
    if (but.checked) view = but.value;
  });
  return view;
}

async function get_vanitypes() {
  var url = "/w/extensions/SearchAdmin/src/util.php?func=get_vanitypes";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_vanitypes = data; 
    })
    .catch(function(error) {
    });
}

function get_master(focus) {
  var panel, view, url, vtyp_id, catg_id;
  
  panel = "master";
  view = radio_value(div_rad_view);
  if (view == "catg") hide_navig();
  set_buttons_filter(view);
  if (!focus) focus = g_focus[view]; else g_focus[view] = focus;
  vtyp_id = sel_vanitype.value;
  catg_id = g_vanitypes[vtyp_id].catg_id;
  
  /*
  if (view == "group" || view == "config") hide_filter();
  else if (view == "user") show_filter();
  if (view != "user") hide_options();*/
  
  g_sel_row = null; 
  div_detail.innerHTML = "";
  div_master.innerHTML = "Data is being retrieved ...";
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=get_master&view=" + view + 
    "&vtyp_id=" + vtyp_id + "&catg_id=" + catg_id + "&filt=" + inp_filt_master.value;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (view == "catg") {
        g_categories = data;
        dsp_categories(focus);
      }
      else if (view == "vani") { /* TODO: g_users should come as array */
        g_vanis = data; 
        dsp_vanis(focus);
      }
    })
    .catch(function(error) {
    });
}

function radio_value(div) {
  var radio, value = 0;
  radio = Array.from(div.getElementsByTagName("input"));
  radio.forEach((but) => {
    if (but.checked) value = but.value;
  });
  return value;
}

async function get_filt_pages(reset) {
  var vani_id, url, ofs, filt, count, sort = "";
  
  vani_id = g_sel_row.id.substring(2);
  filt = inp_filt_detail.value;
  count = (reset && filt);
  g_tot_records = (count ? await page_count(vani_id,filt) : (reset ? g_vanis[vani_id].tot_pages : g_tot_records));

  g_tot_pages = Math.ceil(g_tot_records / sel_rpp.value);
  if (reset) g_cur_page = Math.min(g_tot_pages,1);
  ofs = (Math.max(g_cur_page - 1,0) * sel_rpp.value).toString();
  sort = JSON.stringify(g_sort_options["detail"]["vani"][g_sort_index["detail"]["vani"]]);

  dsp_navig();
  div_detail.innerHTML = "Data is being retrieved ..."; 
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=get_filt_pages&vani_id=" + vani_id +
    "&rpp=" + sel_rpp.value + "&ofs=" + ofs + "&filt=" + filt + "&sort=" + sort;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_filt_pages = data; 
      dsp_filt_pages();
    })
    .catch(function(error) {
    });
}

async function page_count(vani_id, filt) {
  var url, count = 0;
  
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=page_count&vani_id=" + vani_id + "&filt=" + filt;
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      count = data; 
    })
    .catch(function(error) {
    });
  return count;
}

function gen_thead(thead, columns, panel, view) {
  var tr, th, sview, classes = ["fa-arrow-up","fa-arrow-down"];
  
  tr = document.createElement("tr");
  columns.forEach(column => {
    th = document.createElement("th");
    th.textContent = column[0];
    th.style.width = column[1];
    if (column[2]) {
      let i = document.createElement("i");
      g_sort_options[panel][view][column[3]].elem = i;
      i.classList = `fa ${classes[g_sort_options[panel][view][g_sort_index[panel][view]].sort]} arrow`;
      if (column[3] != g_sort_index[panel][view]) i.classList.add("hidden");
      th.appendChild(i);
      th.title = "Click to sort on this column";
      th.onclick = () => toggle_sort(column[3], i, panel, view);
    }
    tr.appendChild(th);
  });
  thead.appendChild(tr);
}

function add_cell(row, text, clas, width) {
  var cel;
  cel = document.createElement("td");
  cel.textContent = text;
  if (clas) cel.classList = clas;
  cel.style.width = width;
  row.appendChild(cel);
}

function add_link(row, prefix, title, clas, width) {
  var cel, a, href;
  cel = document.createElement("td");
  a =  document.createElement("a");
  a.text  = title;
  a.href  = 
    "https://" + (g_live_server ? "" : "dev.") + "vanisource.org/wiki/" + 
    prefix + title.replaceAll(" ", "_");
  a.target = "_blank";
  if (clas) cel.classList = clas;
  cel.style.width = width;
  cel.appendChild(a);
  row.appendChild(cel);
}

function add_checkbox(view, row, value, width) {
  var cel, chb;
  
  cel = document.createElement("td");
  chb = document.createElement('input'); 
  chb.classList = "special checkbox_input";
  chb.type = "checkbox"; 
  chb.checked = g_range[view].includes(value); 
  chb.onchange = () => set_range(view, chb, +value);

  cel.style.width = width;
  cel.classList = "chb_input";
  cel.appendChild(chb);
  row.appendChild(cel);
}

function set_range(view, chb, value) {
  var includes = g_range[view].includes(value);
  if (chb.checked && !includes) 
    g_range[view].push(value);
  else if (!chb.checked && includes)
    g_range[view] = g_range[view].filter(item => item !== value);
}

function handle_row_click(panel, event, row, key) {
  var obj, view;
  
  obj = event.target;
  if (obj.classList.contains("special")) return;

  view = get_view_value();
  if (g_sel_row) g_sel_row.classList.remove("selrow");
  g_sel_row = row;
  row.classList.add("selrow");
  
  g_sync = (view == "vani");
  g_focus[view] = g_sel_row.id; 
  
  if (g_sync) {
    get_filt_pages(g_reset);
    g_reset = true;
  }
  else g_sync = true;
}

function init_arrow() {
  document.body.addEventListener("keydown", function(event) {
    if (event.keyCode < 35 || event.keyCode > 40) return;
    if (document.activeElement.classList.contains("arrow")) return;
    event.preventDefault(); handle_arrow(event);
  });
}

function handle_arrow(e) {
  if (!g_sel_row) return;
  switch (e.keyCode) {
    case 35:
    { row_last(g_sel_row); break }
    case 36:
    { row_first(g_sel_row); break }
    case 38:
    { row_up(g_sel_row); break }
    case 40:
    { row_down(g_sel_row); break }
  }
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

function show_message(msg) {
  div_modal_body.innerHTML = msg;
  show_modal("", null);
}

function hide_message(msg) {
  hide_modal();
}

function ins_vanis() {
  var view, sel, func, vtyp_id;
  
  view = "catg";
  if (!g_range[view].length) return;
  sel = g_range[view].join(", ");
  if (!confirm("Are you sure that you want to insert these category pages as vanis?\n\n" + sel)) return;
  
  func = "ins_vanis";
  vtyp_id = sel_vanitype.value;
  var formData = new FormData();
  formData.append('range', JSON.stringify(g_range[view]));
  var url = 
    "/w/extensions/SearchAdmin/src/util.php?func=" + func + "&vtyp_id=" + vtyp_id;
    
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then(function(data) {
      if (data.status == "ok") {
        clear_range();
        get_master("");
      }
    })
    .catch(function(error) {
      err = error;
    });
}

function del_vanis() {
  var view, func, sel;
  
  view = "vani";
  if (!g_range[view].length) return;
  func = "del_vanis";
  sel = g_range[view].join(", ");
  if (!confirm("Are you sure that you want to delete these vanis?\n\n" + sel)) return;
  
  var formData = new FormData();
  formData.append('range', JSON.stringify(g_range[view]));
  var url = 
    "/w/extensions/SearchAdmin/src/util.php?func=" + func;
    
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then(function(data) {
      if (data.status == "ok") {
        g_range[view] = [];
        get_master("");
      }
    })
    .catch(function(error) {
      err = error;
    });
}

function select_all() {
  var panel, view, checkboxes, value;

  panel = "master";
  view = radio_value(div_rad_view);
  g_range[view] = [];
  checkboxes = Array.from(g_tbody[panel].getElementsByTagName("input"));
  checkboxes.forEach((box) => {
    if (!box.checked) box.checked = true;
    value = +box.parentNode.parentNode.id.substring(2);
    g_range[view].push(value); 
  });
}

function clear_range() {
  var panel, view, checkboxes;
  
  panel = "master";
  view = radio_value(div_rad_view);
  g_range[view] = [];
  checkboxes = Array.from(g_tbody[panel].getElementsByTagName("input"));
  checkboxes.forEach((box) => {
    if (box.checked) box.checked = false;
  });
}

function lnk_vanis() {
  var view, func, sel;
  
  view = "vani";
  if (!g_range[view].length) return;
  func = "lnk_vanis";
  sel = g_range[view].join(", ");
  if (!confirm("Are you sure that you want to link these vanis?\n\n" + sel)) return;
  
  show_message("Please wait ...");
  var formData = new FormData();
  formData.append('range', JSON.stringify(g_range[view]));
  var url = 
    "/w/extensions/SearchAdmin/src/util.php?func=" + func;
    
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then(function(data) {
      if (data.status == "ok") {
        hide_message();
        //g_range[view] = [];
        clear_range();
        get_master("");
      }
    })
    .catch(function(error) {
      err = error;
    });
}

function row_first(row) {
  var first = row.parentNode.firstElementChild;
  if (!first) return;
  row_select(first);
}

function row_last(row) {
  var last = row.parentNode.lastElementChild;
  if (!last) return;
  row_select(last);
}

function row_up(row) {
  var prev = row.previousElementSibling;
  if (!prev) return;
  row_select(prev);
}

function row_down(row) {
  var next = row.nextElementSibling;
  if (!next) return;
  row_select(next);
}

function row_select(row) {
  row.scrollIntoView({block: "center"});
  row.click();
}