g_groups = [];
g_configs = [];

g_range = [];
g_focus = {"group": "", "user": "", "config": ""};
g_tot_records = 0;
g_tot_pages = 0;
g_cur_page = 1;
g_sel_row = null;
g_tbody = {"master": null, "detail": null, "modal": null};
g_sort_options = 
  {"master":
    {"group": [
      {"type": "name", "sort": 0, "elem": null},
      {"type": "total", "sort": 0, "elem": null}
     ],
     "user": [
      {"type": "id", "sort": 0, "elem": null},
      {"type": "name", "sort": 0, "elem": null},
      {"type": "total", "sort": 0, "elem": null},/* used in master:user view */
      {"type": "tot_config", "sort": 0, "elem": null},/* used in master:user view */
      {"type": "value", "sort": 0, "elem": null} /* used in detail:config view */
     ],
     "config": [
      {"type": "prop", "sort": 0, "elem": null},
      {"type": "total", "sort": 0, "elem": null}, /* used in master:config view */
      {"type": "value", "sort": 0, "elem": null} /* used in detail:user view */
     ]},
   "detail":
    {"group": [
      {"type": "name", "sort": 0, "elem": null},
      {"type": "total", "sort": 0, "elem": null}
     ],
     "user": [
      {"type": "id", "sort": 0, "elem": null},
      {"type": "name", "sort": 0, "elem": null},
      {"type": "total", "sort": 0, "elem": null},/* used in master:user view */
      {"type": "tot_config", "sort": 0, "elem": null},/* used in master:user view */
      {"type": "value", "sort": 0, "elem": null} /* used in detail:config view */
     ],
     "config": [
      {"type": "prop", "sort": 0, "elem": null},
      {"type": "total", "sort": 0, "elem": null}, /* used in master:config view */
      {"type": "value", "sort": 0, "elem": null} /* used in detail:user view */
     ]},     
   "modal":
    {"group": [
      {"type": "name", "sort": 0, "elem": null}
     ],
     "user": [
      {"type": "id", "sort": 0, "elem": null},
      {"type": "name", "sort": 0, "elem": null}
     ]}
  };
g_sort_index = 
  {"master": {"group": 0, "user": 1, "config": 0},
   "detail": {"group": 0, "user": 1, "config": 0},
   "modal": {"group": 0, "user": 1}
  };

mw.hook('wikipage.content').add( function () {
  init_main();
});

function init_main() {
  init_modal();
  init_arrow();
  gen_sel_petal();
  gen_inp_filter(div_filt_master,"inp_filt_master",() => get_master(""));
  gen_rad_view();
  gen_div_right();
  gen_rad_display();
  sel_petal.onchange();
}

function gen_sel_petal() {
  var sel, lab, opt, petals = ["Vanipedia","Vaniquotes","Vanisource","Vanimedia"];

  sel = document.createElement("select");
  sel.id = "sel_petal"; 
  sel.onchange = () => { 
    get_master("");
  };

  petals.forEach(petal => {
    opt = document.createElement("option");
    opt.value = petal.toLowerCase(); opt.textContent = petal;
    sel.appendChild(opt);
  });
  
  lab = document.createElement("label");
  lab.textContent = "Petal: ";

  div_sel_petal.appendChild(lab);
  div_sel_petal.appendChild(sel);
}

function gen_rad_view() {
  var lab;
  lab = document.createElement("label");
  lab.textContent = "View: ";
  div_rad_view.appendChild(lab);
  add_rad_button(div_rad_view, "view", "group", "Group", true, "5px", () => get_master(""));
  add_rad_button(div_rad_view, "view", "user", "User", false, "5px", () => get_master(""));
  add_rad_button(div_rad_view, "view", "config", "Config", false, "3px", () => get_master(""));
}

function gen_rad_display() {
  var lab;
  lab = document.createElement("label");
  lab.textContent = "Display: ";
  div_rad_display.appendChild(lab);
  add_rad_button(div_rad_display, "display", "dsp_group", "Group", true, "5px", () => change_display());
  add_rad_button(div_rad_display, "display", "dsp_config", "Config", false, "3px", () => change_display());
}

function change_display() {
  
  var view = radio_value(div_rad_view);
  set_buttons(view);
  g_sel_row.click();
}

function gen_inp_filter(parent, id, func) {
  var lab, inp;

  inp = document.createElement("input");
  inp.id = id;
  inp.type = "text";
  inp.placeholder = "User";
  inp.classList = "myinput arrow";
  inp.onchange = func;

  lab = document.createElement("label");
  lab.textContent = "Filter: ";

  parent.appendChild(lab);
  parent.appendChild(inp);
}

function add_rad_button(parent, group, value, text, checked, margin, func) {
  var div, inp, lab;
  
  div = document.createElement("div");
  div.style.display = "inline-block";
  div.style.marginRight = margin;
  inp = document.createElement("input");
  inp.type = "radio";  
  inp.id = "but_" + value;
  inp.classList = "radio_input";
  inp.name = group; 
  inp.value = value; 
  inp.checked = checked;
  inp.onchange = func;
  div.appendChild(inp);
  
  lab = document.createElement("label");
  lab.htmlFor = inp.id; 
  lab.textContent = text;
  div.appendChild(lab);
  parent.appendChild(div);
}

function radio_value(div) {
  var radio, value = 0;
  radio = Array.from(div.getElementsByTagName("input"));
  radio.forEach((but) => {
    if (but.checked) value = but.value;
  });
  return value;
}

function get_master(focus) {
  var view, focus,url, users, configs, filt = "";
  
  view = radio_value(div_rad_view);
  set_buttons(view);
  if (!focus) focus = g_focus[view]; else g_focus[view] = focus;
  if (view == "group" || view == "config") hide_filter();
  else if (view == "user") show_filter();
  if (view != "user") hide_options();
  
  g_sel_row = null; 
  div_detail.innerHTML = "";
  div_master.innerHTML = "Data is being retrieved ...";
  url = 
    "/w/extensions/UserAdmin/src/util.php?func=get_master&petal=" + sel_petal.value + 
    "&view=" + view + "&filt=" + inp_filt_master.value;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (view == "group") {
        g_groups = data;
        dsp_groups(div_master, Object.keys(g_groups), "master", view, focus, "");
      }
      else if (view == "user") { /* TODO: g_users should come as array */
        g_users = data; users = [];
        Object.keys(g_users).forEach(name => {
          users.push({"id": g_users[name].id, "name": name});
        });
        dsp_users(div_master, users, "master", view, focus, "");
      }
      else if (view == "config") { /* TODO: g_configs should come as array */
        g_configs = data; configs = [];
        Object.keys(g_configs).forEach(prop => {
          configs.push({
            "id": g_configs[prop].id,
            "name": g_configs[prop].name,
            "default": g_configs[prop].default,
            "desc": g_configs[prop].desc,
            "users": g_configs[prop].users,
          });
        });
        dsp_configs(div_master, configs, "master", view, focus, "");
      }
    })
    .catch(function(error) {
    });
}

function set_buttons(view) {
  var show, display;
  
  show = (view == "group" || (view == "user" && radio_value(div_rad_display) == "dsp_group"));
  display = (show ? "block" : "none");
  but_all.style.display = display;
  but_clr.style.display = display;
  but_add.style.display = display;
  but_del.style.display = display;
}

function get_groups(user, view) {
  firstHeading.textContent = "User Admin: " + user;
  dsp_groups(div_detail, g_users[user].groups, "detail", view, "", "");
}

function dsp_groups(parent, groups, panel, view, focus, prefix) {
  var tbl, thead, arr, tbody;
  
  clear_range();

  tbl = document.createElement("table");
  tbl.id = "tbl_groups";
  tbl.classList = view;
  thead = document.createElement("thead");
  arr = [["#","50px",0],["User Group","250px",1,0]];
  if (view == "group") arr.push(["Tot.","50px",1,1]);
  if (view == "user") arr.push(["Sel.","40px",0]);
  gen_thead(thead, arr, panel, view);
  tbody = document.createElement("tbody");
  fill_tbody_group(tbody, groups, panel, view, prefix);

  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);
  
  if (view == "user") show_options(tbl_groups);

  if (view == "group") {
    if (!focus) row = tbody.firstElementChild;
    else {
      row = document.getElementById(focus);
      if (row == null) row = tbody.firstElementChild;
    }
    row.scrollIntoView({block: "center"});
    row.click();
  }
}

function fill_tbody_group(tbody, groups, panel, view, prefix) {
  var sview, idx, row, type, sort;

  if (panel == "modal") sview = "group";
  else if (panel == "master") sview = view;
  else sview = (view == "group" ? "user" : "group");
  
  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
//  if (panel != "modal") {
    type = g_sort_options[panel][sview][g_sort_index[panel][sview]].type;
    sort = g_sort_options[panel][sview][g_sort_index[panel][sview]].sort;
    if (type == "name") {
      if (sort == 0) groups.sort(function(a, b){ if (a < b) return -1; if (a > b) return 1; return 0});
      else groups.sort(function(a, b){if (a < b) return 1; if (a > b) return -1; return 0});      
    }
    else if (type == "total") {
      if (sort == 0) groups.sort(function(a, b){return g_groups[a].length-g_groups[b].length});
      else groups.sort(function(a, b){return g_groups[b].length-g_groups[a].length});
    }
//  }
  
  idx = 0;
  groups.forEach(name => {
    idx++;
    let row = document.createElement("tr");
    row.id = prefix + name;
    if (view == "group") row.onclick = (event) => handle_row_click(event, row, name);
    add_cell(row, idx, "number_cel", "50px");
    add_cell(row, name, "", "250px");
    if (view == "group") add_cell(row, g_groups[name].length, "number_cel", "50px");
    if (view == "user") add_checkbox(row, name, "40px");
    tbody.appendChild(row);
  });
}

function dsp_configs(parent, configs, panel, view, focus, prefix) {
  var tbl, thead, arr, tbody;
  
  clear_range();

  tbl = document.createElement("table");
  tbl.id = "tbl_configs";
  tbl.classList = view;
  thead = document.createElement("thead");
  arr = [["#","50px",0],["Property","250px",1,0]];
  if (view == "config") arr.push(["Tot.","50px",1,1]);
  if (view == "user") arr.push(["Value","250px",1,2]);
  
  //if (view == "user") arr.push(["Sel.","40px",0]);
  gen_thead(thead, arr, panel, view);
  tbody = document.createElement("tbody");
  fill_tbody_config(tbody, configs, panel, view, prefix);

  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);

  if (view == "user") show_options(tbl_configs);
  
  if (view == "config") {
    if (!focus) row = tbody.firstElementChild;
    else {
      row = document.getElementById(focus);
      if (row == null) row = tbody.firstElementChild;
    }
    row.scrollIntoView({block: "center"});
    row.click();
  }
}

function fill_tbody_config(tbody, configs, panel, view, prefix) {
  var sview, idx, row, type, sort;

  if (panel == "master") sview = view;
  else sview = (view == "config" ? "user" : "config");

  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
//  if (panel != "modal") {

    type = g_sort_options[panel][sview][g_sort_index[panel][sview]].type;
    sort = g_sort_options[panel][sview][g_sort_index[panel][sview]].sort;
    if (type == "prop") {
      if (sort == 0) configs.sort(function(a, b){ if (a.name < b.name) return -1; if (a.name > b.name) return 1; return 0});
      else configs.sort(function(a, b){if (a.name < b.name) return 1; if (a > b) return -1; return 0});      
    }
    else if (type == "total") {
      if (sort == 0) configs.sort(function(a, b){return g_configs[a.name].users.length-g_configs[b.name].users.length});
      else configs.sort(function(a, b){return g_configs[b.name].users.length-g_configs[a.name].users.length});
    } if (type == "value") {
      if (sort == 0) configs.sort(function(a, b){ if (a.value < b.value) return -1; if (a.value > b.value) return 1; return 0});
      else configs.sort(function(a, b){if (a.value < b.value) return 1; if (a.value > b.value) return -1; return 0});      
    }
    
//  }
  
  idx = 0;
  configs.forEach(prop => {
    idx++;
    let row = document.createElement("tr");
    row.id = prefix + prop.name;
    row.title = prop.desc;
    if (view == "config") row.onclick = (event) => handle_row_click(event, row, prop.name);
    add_cell(row, idx, "number_cel", "50px");
    add_cell(row, prop.name, "", "250px");
    if (view == "config") add_cell(row, prop.users.length, "number_cel", "50px");
    if (view == "user") add_cell(row, prop.value, "", "250px");
    //if (view == "user") add_checkbox(row, name, "40px");
    tbody.appendChild(row);
  });
}

function gen_thead(thead, columns, panel, view) {
  var tr, th, display, sview, classes = ["fa-arrow-up","fa-arrow-down"];
  
  display = radio_value(div_rad_display); /* NB: same as in toggle_sort() */
  if (panel == "master") sview = view;
  else sview = (view == "group" || view == "config" ? "user" : (display == "dsp_group" ? "group" : "config"));

  tr = document.createElement("tr");
  columns.forEach(column => {
    th = document.createElement("th");
    th.textContent = column[0];
    th.style.width = column[1];
//    if ((panel != "modal") && column[2]) {
    if (column[2]) {
      let i = document.createElement("i");
      g_sort_options[panel][sview][column[3]].elem = i;
      i.classList = `fa ${classes[g_sort_options[panel][sview][g_sort_index[panel][sview]].sort]} arrow`;
      if (column[3] != g_sort_index[panel][sview]) i.classList.add("hidden");
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

function add_checkbox(row, value, width) {
  var cel, chb;
  
  cel = document.createElement("td");
  chb = document.createElement('input'); 
  chb.classList = "special checkbox_input";
  chb.type = "checkbox"; 
  chb.checked = g_range.includes(value); 
  chb.onchange = () => set_range(chb, value);

  cel.style.width = width;
  cel.classList = "chb_input";
  cel.appendChild(chb);
  row.appendChild(cel);
}

function set_range(chb, value) {
  var includes = g_range.includes(value);
  if (chb.checked && !includes) 
    g_range.push(value);
  else if (!chb.checked && includes)
    g_range = g_range.filter(item => item !== value);
}

function handle_row_click(event, row, key) {
  var obj, view, display;
  
  obj = event.target;
  if (obj.classList.contains("special")) return;

  if (g_sel_row) g_sel_row.classList.remove("selrow");
  g_sel_row = row;
  row.classList.add("selrow");
  
  view = radio_value(div_rad_view);
  g_focus[view] = g_sel_row.id;
  
  if (view == "group") get_users(key, view);
  else if (view == "config") get_conf_users(key, view);
  else if (view == "user") {
    display = radio_value(div_rad_display);
    if (display == "dsp_group") get_groups(key, view);
    else if (display == "dsp_config") get_user_confs(key, view);
  }
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
    { row_last(); break }
    case 36:
    { row_first(); break }
    case 38:
    { row_up(); break }
    case 40:
    { row_down(); break }
  }
}

function row_first() {
  var first = g_sel_row.parentNode.firstElementChild;
  if (!first) return;
  row_select(first);
}

function row_last() {
  var last = g_sel_row.parentNode.lastElementChild;
  if (!last) return;
  row_select(last);
}

function row_up() {
  var prev = g_sel_row.previousElementSibling;
  if (!prev) return;
  row_select(prev);
}

function row_down() {
  var next = g_sel_row.nextElementSibling;
  if (!next) return;
  row_select(next);
}

function row_select(row) {
  row.scrollIntoView({block: "center"});
  row.click();
}