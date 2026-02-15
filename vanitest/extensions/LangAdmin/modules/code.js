g_space_gain = 0;
g_tot_space = 0;

function init_modal() {
  var but;
  
  spn_modal_close.onclick = () => { hide_modal() };
  window.onclick = (event)=> {
    if (event.target == div_modal) hide_modal();
  }
}

function gen_div_right() {
  var div, but1, but2, but3, but4;

  div = document.createElement("div");

  but1 = cre_button("","Refresh", "Refresh data", "right", () => get_master(g_sel_row.id));
  but2 = cre_button("but_upd","Update", "Update language", "right", () => edit_lang(false));
  but3 = cre_button("but_add","Add", "Add language", "right", () => edit_lang(true));  
  but4 = cre_button("but_del","Delete", "Delete language", "right", () => del_lang());

  div.appendChild(but4);
  div.appendChild(but3);
  div.appendChild(but2);
  div.appendChild(but1);
  div_right.appendChild(div);
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

function del_lang() {
  var id, base, func, url;
  
  if (!confirm("Are you sure you want to delete this language?")) return;
  id = g_sel_row.id.split("_")[1];
  func = "del_lang";
  base = "/w/extensions/LangAdmin/src/edit_lang.php";
  url = base + "?func=" + func + "&id=" + id;

  fetch(encodeURI(url))
    .then((resp) => resp.json())
    .then(function(data) {
      get_master("");
    })
    .catch(function(error) {
    });
}

function show_lang(chb, id) {
  var id, base, func, url;
  
  func = "show_lang";
  base = "/w/extensions/LangAdmin/src/edit_lang.php";
  url = base + "?func=" + func + "&id=" + id + "&show=" + (+chb.checked);
  fetch(encodeURI(url));
}

function edit_lang(create) {
  var div, id;
  
  id = (create ? 0 : g_sel_row.id.split("_")[1]);
  show_modal(create, () => submit_edit(create, id));
  div_modal_table.innerHTML = "";
  div = document.createElement("div");
  div.style.marginBottom = "5px";
  add_inp_elem(div,"Code: ","text","inp_lang_code");
  add_inp_elem(div,"Name: ","text","inp_lang_name");
  add_inp_elem(div,"English: ","text","inp_lang_english");
  div_modal_table.appendChild(div);
  
  div = document.createElement("div");
  div.style.marginBottom = "5px";
  div_modal_table.appendChild(div);
  if (!create) values_to_inp(id);
}

function values_to_inp(id) {
  var arr_lang = g_languages.filter(lang => lang.id == id);
  inp_lang_code.value = arr_lang[0].code;
  inp_lang_name.value = arr_lang[0].name;
  inp_lang_english.value = arr_lang[0].english;
}

function add_inp_elem(parent,label,type, id) {
  var lab, inp; 
  lab = document.createElement("label");
  lab.textContent = label;
  inp = document.createElement("input");
  inp.type = type;
  inp.id = id;
  inp.classList = "edit_lang";
  parent.appendChild(lab);
  parent.appendChild(inp);
}

function show_modal(create, func) {
  var but, div;
  
  div_modal.style.display = "block";
  spn_modal_title.textContent = (create ? "Add language" : "Update language");
  
  div_modal_footer.innerHTML = "";
  but = cre_button("","Submit", "Submit and close window", "none", func);
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

function toggle_sort(idx, obj) {
  var sort, focus, groups;
  var classes = ["fa-arrow-up","fa-arrow-down"];
  
  if (g_sort_index == idx) {
    sort = g_sort_options[idx].sort;
    sort = 1 - sort;
    g_sort_options[idx].sort = sort;
    obj.classList.replace(classes[1 - sort],classes[sort]);
  }
  else {
    g_sort_options[g_sort_index].elem.classList.toggle("hidden");
    g_sort_options[idx].elem.classList.toggle("hidden");
  }
  g_sort_index = idx;
  
  focus = g_sel_row.id;
  fill_tbody(g_tbody, g_languages, "lang_");

  row = document.getElementById(focus);
  row_select(row);
}

function submit_edit(create, id) {
  var error, base, url, func, code, name, english;
  
  func = (create ? "cre_lang": "upd_lang");
  code = inp_lang_code.value.trim(); 
  name = inp_lang_name.value.trim();
  english = inp_lang_english.value.trim();
  
  error = valid_input(code,name,english) 
  if (error) { div_modal_error.textContent = error; return; }

  base= "/w/extensions/LangAdmin/src/edit_lang.php";
  url = 
    base + "?func=" + func + "&id=" + id + "&code=" + code + 
    "&name=" + name + "&english=" + english;

  fetch(encodeURI(url))
    .then((resp) => resp.json())
    .then(function(data) {
      if (data.error)
        div_modal_error.textContent = data.error;
      else {
        g_focus = "lang_" + data.id;
        hide_modal();
        get_master("");
      }
    })
    .catch(function(error) {
    });
}

function valid_input(code,name,english) {
  var err = "";
  if (!code) { err = "Code is mandatory"; return err; }
  if (!name) { err = "Name is mandatory"; return err; }
  if (!english) { err = "English is mandatory"; return err; }
}
