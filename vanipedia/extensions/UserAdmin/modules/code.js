g_users = [];
g_space_gain = 0;
g_tot_space = 0;

function init_modal() {
  var but;
  
  spn_modal_close.onclick = () => { hide_modal() };
  window.onclick = (event)=> {
    if (event.target == div_modal) hide_modal();
  }
}

function get_users(group, view) {
  firstHeading.textContent = "User Admin: " + group;
  dsp_users(div_detail, g_groups[group], "detail", view, "", "");
}

function get_conf_users(config, view) {
  firstHeading.textContent = "User Admin: " + config;
  dsp_users(div_detail, g_configs[config].users, "detail", view, "", "");
}

function get_user_confs(user, view) {
  firstHeading.textContent = "User Admin: " + user;
  dsp_configs(div_detail, g_users[user].configs, "detail", view, focus, "");
}

function dsp_users(parent, users, panel, view, focus, prefix) {
  var tbl, thead, arr, tbody, idx, cel, size, row;
  
  clear_range();

  tbl = document.createElement("table");
  tbl.id = "tbl_users";
  tbl.classList = view;
  thead = document.createElement("thead");
  arr = [["#","50px",0],["Id","50px",1,0],["User","200px",1,1]];
  if (view == "user") arr.push(["Gr.","50px",1,2]);
  if (view == "user") arr.push(["Cf.","50px",1,3]);
  if (view == "config") arr.push(["Value","250px",1,4]);
  if (view == "group") arr.push(["Sel.","40px",0]);
  gen_thead(thead, arr, panel, view); 
  tbody = document.createElement("tbody"); 
  fill_tbody_user(tbody, users, panel, view, prefix);
  
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);

  if (view == "user") {
    if (!focus) row = tbody.firstElementChild;
    else {
      row = document.getElementById(focus);
      if (row == null) row = tbody.firstElementChild;
    }
    row.scrollIntoView({block: "center"});
    row.click();
  }
}

function fill_tbody_user(tbody, users, panel, view, prefix) {
  var sview, idx, row, type, sort;

  if (panel == "modal") sview = "user";
  else if (panel == "master") sview = view;
  else sview = ((view == "group" || view == "config") ? "user" : "group");

  g_tbody[panel] = tbody;
  tbody.innerHTML = "";
  //if (panel != "modal") {
    type = g_sort_options[panel][sview][g_sort_index[panel][sview]].type;
    sort = g_sort_options[panel][sview][g_sort_index[panel][sview]].sort;
    if (type == "id") {
      if (sort == 0) users.sort(function(a, b){ return a.id-b.id });
      else users.sort(function(a, b){ return b.id-a.id });
    } else if (type == "name") {
      if (sort == 0) users.sort(function(a, b){ if (a.name < b.name) return -1; if (a.name > b.name) return 1; return 0});
      else users.sort(function(a, b){if (a.name < b.name) return 1; if (a.name > b.name) return -1; return 0});      
    } else if (type == "total") {
      if (sort == 0) users.sort(function(a, b){return g_users[a.name].groups.length-g_users[b.name].groups.length});
      else users.sort(function(a, b){return g_users[b.name].groups.length-g_users[a.name].groups.length});
    } else if (type == "tot_config") {
      if (sort == 0) users.sort(function(a, b){return g_users[a.name].configs.length-g_users[b.name].configs.length});
      else users.sort(function(a, b){return g_users[b.name].configs.length-g_users[a.name].configs.length});
    } else if (type == "value") {
      if (sort == 0) users.sort(function(a, b){ if (a.value < b.value) return -1; if (a.value > b.value) return 1; return 0});
      else users.sort(function(a, b){if (a.value < b.value) return 1; if (a.value > b.value) return -1; return 0});      
    }
  //}
  
  idx = 0;
  users.forEach(user => {
    idx++;
    let row = document.createElement("tr");
    row.id = prefix + user.name;
    if (view == "user") row.onclick = (event) => handle_row_click(event, row, user.name);
    add_cell(row, idx, "number_cel", "50px");
    add_cell(row, user.id, "number_cel", "50px");
    add_cell(row, user.name, "", "200px");
    if (view == "config") add_cell(row, user.value, "", "250px");
    
    if (view == "user") add_cell(row, g_users[user.name].groups.length, "number_cel", "50px");
    if (view == "user") add_cell(row, g_users[user.name].configs.length, "number_cel", "50px");
    if (view == "group") add_checkbox(row, user.name, "40px");
    tbody.appendChild(row);
  });
}

function gen_div_right() {
  var div, but1, but2, but3, but4, but5, but6;

  div = document.createElement("div");

  but1 = cre_button("but_all","All", "Select all", "right", () => select_all());
  but2 = cre_button("but_clr","Clear", "Clear selection", "right", () => clear_range());
  but3 = cre_button("","Refresh", "Refresh data", "right", () => get_master(g_sel_row.id));
  but4 = cre_button("but_del","Remove", "Remove selection", "right", () => del_detail());
  but5 = cre_button("but_add","Add", "Add records", "right", () => ins_detail());
  but6 = cre_button("","Account", "Create user account", "right", () => do_account());
  
  div.appendChild(but6);
  div.appendChild(but5);
  div.appendChild(but4);
  div.appendChild(but3);
  div.appendChild(but2);
  div.appendChild(but1);
  div_right.appendChild(div);
}

function del_detail() {
  if (!g_range.length) return;
  
  var selection = g_range.join(", ");
  if (!confirm("Are you sure that you want to remove this selection?\n\n" + selection)) return;
  
  var view = radio_value(div_rad_view);  
  var func = (view == "group" ? "del_users" : "del_groups");
  var key = g_sel_row.id;
  var formData = new FormData();
  formData.append('range', JSON.stringify(g_range));
  var url = 
    "/w/extensions/UserAdmin/src/util.php?func=" + func + "&petal=" + 
    sel_petal.value + "&key=" + key;
    
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then(function(data) {
      if (data.status == "ok") {
        clear_range();
        get_master(g_sel_row.id);
      }
    })
    .catch(function(error) {
      err = error;
    });
}

function cre_button(id, text, title, float, func) {
  var but;
  but = document.createElement("button");
  if (id) but.id = id;
  but.textContent = text;
  but.title = title;
  but.style.float = float;
  but.onclick = func;
  
  return but;
}

function clear_range() {
  var checkboxes;
  
  g_range = [];
  checkboxes = Array.from(div_detail.getElementsByTagName("input"));
  checkboxes.forEach((box) => {
    if (box.checked) box.checked = false;
  });
}

function select_all() {
  var checkboxes, value;

  g_range = [];
  checkboxes = Array.from(div_detail.getElementsByTagName("input"));
  checkboxes.forEach((box) => {
    if (!box.checked) box.checked = true;
    value = box.parentNode.parentNode.id;
    g_range.push(value); 
  });
}

function ins_detail() {
  var view;

  view = radio_value(div_rad_view);
  clear_range();
  show_modal(view, "Submit selection and close window", () => ins_execute());
  get_ins_data(view);
}

function do_account() {
  var div;
  show_modal("account", "Submit and close window", () => create_account());
  div_modal_table.innerHTML = "";
  div = document.createElement("div");
  div.style.marginBottom = "5px";
  add_inp_elem(div,"Username: ","text","inp_username");
  add_inp_elem(div,"Password: ","password","inp_password");
  add_inp_elem(div,"Confirm Password: ","password","inp_confirm");
  add_inp_elem(div,"Email address (optional): ","text","inp_email");
  add_inp_elem(div,"Real name (optional): ","text","inp_realname");
  div_modal_table.appendChild(div);
  
  div = document.createElement("div");
  div.style.marginBottom = "5px";
  div_modal_table.appendChild(div);
}

function add_inp_elem(parent,label,type, id) {
  var lab, inp; 
  lab = document.createElement("label");
  lab.textContent = label;
  inp = document.createElement("input");
  inp.type = type;
  inp.id = id;
  inp.classList = "myinput";
  parent.appendChild(lab);
  parent.appendChild(inp);
}

function show_modal(view, title, func) {
  var but, div;
  
  var titles = {
    "group": "Add users to group:",
    "user": "Add groups to user:",
    "account": "Create user account:"
  };
  div_modal.style.display = "block";
  spn_modal_title.textContent = titles[view];
  
  div_modal_footer.innerHTML = "";
  but = cre_button("","Submit", title, "none", func);
  div_modal_footer.appendChild(but);
  
  div = document.createElement("div");
  div.id = "div_modal_error";
  div_modal_footer.appendChild(div);
}

function hide_modal() {
  div_modal.style.display = "none";
}

function show_filter() {
  div_filt_master.style.display = "block";
}

function hide_filter() {
  div_filt_master.style.display = "none";
}

function show_options(table) {
  var diff;
  
  div_rad_display.style.display = "inline-block";
  diff = div_left.offsetHeight - div_rad_display.offsetHeight;
  div_rad_display.style.left = table.offsetLeft + "px";
  div_rad_display.style.top = (div_left.offsetTop + diff) + "px";
}

function hide_options() {
  div_rad_display.style.display = "none";
}

function ins_execute() {
  if (!g_range.length) return;
  
  var selection = g_range.join(", ");
  if (!confirm("Are you sure that you want to submit this selection?\n\n" + selection)) return;
  
  var view = radio_value(div_rad_view);
  var func = (view == "group" ? "ins_users" : "ins_groups");
  var key = g_sel_row.id;
  var formData = new FormData();
  formData.append('range', JSON.stringify(g_range));
  var url = 
    "/w/extensions/UserAdmin/src/util.php?func=" + func + "&petal=" + 
    sel_petal.value + "&key=" + key;
    
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then(function(data) {
      if (data.status == "ok") {
        hide_modal();
        get_master(g_sel_row.id);
      }
    })
    .catch(function(error) {
      err = error;
    });
}

function get_ins_data(view) {
  var key, url, users;
  
  div_modal_table.innerHTML = "Data is being retrieved ...";
  key = g_sel_row.id;
  url = 
    "/w/extensions/UserAdmin/src/util.php?func=get_ins_data&petal=" + sel_petal.value + "&view=" + view + "&key=" + key;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      if (view == "group") {
        g_users = data; users = [];
        Object.keys(g_users).forEach(name => {
          users.push({"id": g_users[name].id, "name": name});
        });
        dsp_users(div_modal_table, users, "modal", view, "", "tr_");
      }
      else if (view == "user") {
        g_groups = data;
        dsp_groups(div_modal_table, Object.keys(g_groups), "modal", view, "", "tr_");
      }
    })
    .catch(function(error) {
    });
}

function toggle_sort(idx, obj, panel, view) {
  var sort, focus, users, groups, configs, display, sview;
  var classes = ["fa-arrow-up","fa-arrow-down"];
  
  display = radio_value(div_rad_display); /* NB: same as in gen_thead() */
  if (panel == "master") sview = view;
  else sview = (view == "group" || view == "config" ? "user" : (display == "dsp_group" ? "group" : "config"));

  if (g_sort_index[panel][sview] == idx) {
    sort = g_sort_options[panel][sview][idx].sort;
    sort = 1 - sort;
    g_sort_options[panel][sview][idx].sort = sort;
    obj.classList.replace(classes[1 - sort],classes[sort]);
  }
  else {
    g_sort_options[panel][sview][g_sort_index[panel][sview]].elem.classList.toggle("hidden");
    g_sort_options[panel][sview][idx].elem.classList.toggle("hidden");
  }
  g_sort_index[panel][sview] = idx;
  
  focus = g_sel_row.id;
  if (sview == "group") {
    if (panel == "detail") groups = g_users[g_sel_row.id].groups;
    else groups = Object.keys(g_groups);
    fill_tbody_group(g_tbody[panel], groups, panel, view, "");
  }
  else if (sview == "user") {
    if (panel == "detail") {
      if (view == "group") users = g_groups[g_sel_row.id];
      else if (view == "config") users = g_configs[g_sel_row.id].users;
    }
    else {
      users = [];
      Object.keys(g_users).forEach(name => {
      users.push({"id": g_users[name].id, "name": name});
      });
    }
    fill_tbody_user(g_tbody[panel], users, panel, view, "");
  }
  else if (sview == "config") {
    if (panel == "detail") configs = g_users[g_sel_row.id].configs;
    //else configs = Object.keys(g_configs);
    else { /* TODO: see get_master */
      configs = [];
      Object.keys(g_configs).forEach(prop => {
        configs.push({
          "id": g_configs[prop].id,
          "name": g_configs[prop].name,
          "default": g_configs[prop].default,
          "desc": g_configs[prop].desc,
          "users": g_configs[prop].users,
        });
      });
      fill_tbody_config(g_tbody[panel], configs, panel, view, "");
    }
  }
  
  row = document.getElementById(focus);
  // if (view == "user") row.scrollIntoView({block: "center"});
  row.click();
}

/* account creation */
function create_account() {
  var url, user, password, retype, email, realname;
  
  user = inp_username.value;
  password = inp_password.value;
  retype = inp_confirm.value;
  email = inp_email.value;
  realname = inp_realname.value;
  
  url = 
    "/w/extensions/UserAdmin/src/account.php?func=create_account&petal=" + 
    sel_petal.value + "&user=" + user + "&password=" + password + "&retype=" + retype;
  fetch(url)
    .then((resp) => resp.json())
    .then(function(data) {
      if (data.error)
        div_modal_error.textContent = data.error.info;
      else if (data.createaccount.status == 'PASS') {
        user = data.createaccount.username;
        update_user(user, email, realname);
        hide_modal();
        but_user.checked = true;
        get_master(user);
      } else if (data.createaccount.status == 'FAIL') {
        div_modal_error.textContent = data.createaccount.message;
      }
    })
    .catch(function(error) {
    });
}

function update_user(user, email, realname) {
  var url, err;
  
  url = "/w/extensions/UserAdmin/src/util.php?func=update_user&petal=" + 
    sel_petal.value + "&user=" + user + "&email=" + email + "&realname=" + realname;
  fetch(url);
}; 
