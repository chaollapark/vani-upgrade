g_history = [];
g_space_gain = 0;
g_tot_space = 0;

gen_div_right(); /* todo */

function get_history(page_id) {
  var radio, type, ofs, url;
  
  div_history.innerHTML = "History is being retrieved ...";
  url = "/w/extensions/RevisionManager/src/util.php?" + 
    "func=get_history&petal=" + sel_petal.value + "&page_id=" + page_id;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_history = data;
      dsp_history();
    })
    .catch(function(error) {
    });
}

function dsp_history() {
  var tbl, thead, tbody, idx, cel, size;
  
  tbl = document.createElement("table");
  tbl.id = "tbl_history";
  thead = document.createElement("thead");
  gen_thead(thead, [
    ["#","50px",0],
    ["Time","125px",0],
    ["User","125px",0],
    ["Space","90px",0]
  ]);

  tbody = document.createElement("tbody");  
  idx = 0;
  g_history.forEach(hist => {
    idx++;
    let row = document.createElement("tr");
    add_cell(row, idx, "number_cel", "50px");
    add_cell(row, mysql_time_js(hist.time), "", "125px");
    add_cell(row, hist.user, "", "125px");
    size = new Intl.NumberFormat('en-US', {style: 'decimal'}).format(hist.size);
    add_cell(row, size, "number_cel", "90px");
    tbody.appendChild(row);
  });
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  div_history.innerHTML = "";
  div_history.appendChild(tbl);
}

function mysql_time_js(time) {
  var Y = time.substr(0,4);
  var M = time.substr(4,2);
  var D = time.substr(6,2);
  var H = time.substr(8,2);
  var I = time.substr(10,2);
  return Y + "-" + M + "-" + D + " " + H + ":" + I;
}

function gen_div_right() {
  var div, lab, spn, inp, but1, but2, but3, chb, i;

  div = document.createElement("div");
  lab = document.createElement("label");
  lab.textContent = "Pages in range: ";
  
  spn = document.createElement("span");
  spn.id = "spn_tot_range";
  spn.textContent = "0";
  
  but1 = cre_button("Clear", "Clear range", () => clear_range());
  but2 = cre_button("All", "Select all records on this page", () => select_all());
  but3 = cre_button("Delete", "Delete this history", () => del_hist());
  but3.id = "but_del_hist";
  
  div.appendChild(lab);
  div.appendChild(spn);
  div.appendChild(but1);
  div.appendChild(but2);
  div_right.appendChild(div);

  div = document.createElement("div");
  lab = document.createElement("label");
  lab.textContent = "Delete history until: ";
  inp = custom_date_input();

  div.appendChild(lab);
  div.appendChild(inp);
  //div.appendChild(but3);
  div_right.appendChild(div);
  
  div = document.createElement("div");
  chb = document.createElement("input");
  chb.type = "checkbox";
  chb.id = "chb_preserve_first";
  chb.checked = true;
  chb.classList = "checkbox_input";
  chb.onchange = () => get_space_gain();
  
  lab = document.createElement("label");
  lab.textContent = "Preserve first revision: ";
  lab.htmlFor = chb.id;
  
  div.appendChild(lab);
  div.appendChild(chb);
  div_right.appendChild(div);

  div = document.createElement("div");
  lab = document.createElement("label");
  lab.textContent = "Space gain: ";
  spn = document.createElement("span");
  spn.id = "spn_space_gain";
  spn.textContent = "0";
  i = document.createElement(i);
  i.classList = "fas fa-question-circle";
  i.style.marginLeft = "3px";
  i.title = 
    "The displayed space gain might be more than the real space gain. \r\n" +
    "This happens when one or more texts are referred to by more \rn" + 
    "than one revision. In those cases the text cannot be deleted.\r\n" +
    "The computation of the total space gain would become too slow, \r\n" +
    "if this check is made for every single revision.\r\n";

  div.appendChild(lab);
  div.appendChild(spn);
  gen_sel_unit(div, "sel_unit_gain", () => dsp_space_gain());
  //div.appendChild(i);
  div.appendChild(but3);
  div_right.appendChild(div);

}

function cre_button(text, title, func) {
  var but;
  but = document.createElement("button");
  but.textContent = text;
  but.title = title;
  but.style.float = "right";
  but.onclick = func;
  
  return but;
}

function gen_sel_unit(parent, name, func) {
  var sel, opt, units = [["B",1],["Kb",1024],["Mb",1048576],["Gb",1073741824]];

  sel = document.createElement("select");
  sel.id = name;
  sel.title = "Display unit";
  sel.classList = "sel_unit";
  sel.onchange = func;

  units.forEach(unit => {
    opt = document.createElement("option");
    opt.textContent = unit[0]; opt.value = unit[1]; 
    sel.appendChild(opt);
  });
  sel.value = 1073741824;
  parent.appendChild(sel);
}

function clear_range() {
  var checkboxes;
  
  g_range = [];
  dsp_tot_range();
  
  checkboxes = Array.from(div_table.getElementsByTagName("input"));
  checkboxes.forEach((box) => {
    if (box.checked) box.checked = false;
  });
  g_space_gain = 0;
  dsp_space_gain();
}

function select_all() {
  var checkboxes, page_id, range = [];

  checkboxes = Array.from(div_table.getElementsByTagName("input"));
  checkboxes.forEach((box) => {
    if (!box.checked) {
      box.checked = true;
      page_id = +box.parentNode.parentNode.id;
      if (!g_range.includes(page_id)) g_range.push(page_id); 
    }
  });
  dsp_tot_range();
  get_space_gain();
}

function custom_date_input(id) {
  var spn1, spn2, inp1, inp2;
  
  spn1 = document.createElement("span");
  spn1.id = "spn_date";
  
  inp1 = document.createElement("input");
  inp1.type = "date";
  inp1.id = "inp_del_until";
  inp1.onchange = () => sync_del_until(inp1, inp_del_dummy);

  inp2 = document.createElement("input");
  inp2.type = "text";
  inp2.id = "inp_del_dummy";
  inp2.readOnly = true;
  inp2.classList = "dummy_input";
  inp2.placeholder = "yyyy-mm-dd";
  inp2.tabindex = -1;
  inp2.onclick = () => inp1.click();

  spn2 = document.createElement("span");
  spn2.id = "spn_del_dummy";
  spn2.textContent = "▼";
  spn2.tabindex = -1;

  spn1.appendChild(inp1);
  spn1.appendChild(inp2);

  return spn1;
}

function sync_del_until(obj, dummy){
  dummy.value = obj.value;
  get_space_gain();
}

function get_space_gain() {
  var range;
  
  if (!g_range.length) {
    g_space_gain = 0;
    dsp_space_gain();
    return;
  }
  if (!inp_del_until.value) return;
  
  range = JSON.stringify(g_range);
  var formData = new FormData();
  formData.append('range', range);
  var url = 
    "/w/extensions/RevisionManager/src/util.php?func=space_gain&petal=" + 
    sel_petal.value + "&del_until=" + inp_del_until.value + 
    "&preserve_first=" + (+chb_preserve_first.checked) /* todo: validate */
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then(function(data) {
      g_space_gain = data;
      dsp_space_gain();
    })
    .catch(function(error) {
      err = error;
    });
}

function del_hist() {
  if (!g_range.length) return;
  if (!confirm("Are you sure that you want to delete this history?")) return;
  
  var formData = new FormData();
  formData.append('range', JSON.stringify(g_range));
  var url = 
    "/w/extensions/RevisionManager/src/util.php?func=del_history&petal=" + 
    sel_petal.value + "&del_until=" + inp_del_until.value + 
    "&preserve_first=" + (+chb_preserve_first.checked) /* todo: validate */
    
  fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then(function(data) {
      if (data.status == "ok") {
        clear_range(); get_total();
        get_pages(false, false);
        /*if (g_sel_row) get_history(g_sel_row.id);*/
      }
    })
    .catch(function(error) {
      err = error;
    });
}

function get_total() {
  var nspace = get_radio_val(div_rad_nspace);
  var url = "/w/extensions/RevisionManager/src/util.php?func=get_total&petal=" + sel_petal.value + "&nspace=" + nspace;
  
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_tot_space = data;
      dsp_tot_space();
    })
    .catch(function(error) {
    });  
}

function get_radio_val(div_radio) {
  var arr, val;
  arr = Array.from(div_radio.getElementsByTagName("input"));
  arr.forEach((but) => {
    if (but.checked) val = but.value;
  });
  return val;
}

function dsp_tot_space() {
  spn_tot_space.textContent = 
    new Intl.NumberFormat('en-US', {style: 'decimal'}).format(g_tot_space / parseInt(sel_unit_total.value));
}

function dsp_space_gain() {
  spn_space_gain.textContent = 
    new Intl.NumberFormat('en-US', {style: 'decimal'}).format(g_space_gain / parseInt(sel_unit_gain.value));
}

function dsp_tot_range() {
  spn_tot_range.textContent =
  new Intl.NumberFormat('en-US', {style: 'decimal'}).format(g_range.length);
}

function toggle_sort(idx, obj) {
  var sort, classes = ["fa-arrow-up","fa-arrow-down"];
  
  if (g_sort_index == idx) {
    sort = g_sort_options[idx].sort;
    sort = 1 - sort;
    g_sort_options[idx].sort = sort;
    obj.classList.replace(classes[1 - sort],classes[sort]);
  }
  g_sort_index = idx;
  get_pages(false, true);
}