g_live_server = true;
g_users = [];
g_pages = [];
g_sync = true;
g_reset = true;
g_focus = "";
g_sel_row = null;

g_tot_records = 0;
g_tot_pages = 0;
g_cur_page = 1;

g_tbody = {"user": null, "page": null};
g_sort_options = 
  {"user": [
    {"type": "id", "sort": 0, "elem": null},
    {"type": "name", "sort": 0, "elem": null},
    {"type": "tot_pages", "sort": 0, "elem": null},
    {"type": "tot_edits", "sort": 0, "elem": null},
    {"type": "rev_last", "sort": 0, "elem": null},
    {"type": "real", "sort": 0, "elem": null},
    {"type": "email", "sort": 0, "elem": null},
    {"type": "regist", "sort": 0, "elem": null}
   ],
   "page": [
    {"type": "id", "sort": 0, "elem": null},
    {"type": "title", "sort": 0, "elem": null},
    {"type": "tot_revs", "sort": 0, "elem": null},
    {"type": "rev_last", "sort": 0, "elem": null}
   ]};
g_sort_index = 
  {"user": 1, "page": 1};

mw.hook('wikipage.content').add( function () {
  init_main();
});

function init_main() {
  init_modal();
  init_arrow();
  gen_sel_petal();
  gen_inp_filter(div_filt_user,"inp_filt_user",() => get_users("",true));
  gen_rad_view();
  gen_div_right();
  gen_div_navig();
  sel_petal.onchange();
}

function gen_sel_petal() {
  var sel, lab, opt, petals = ["Vanipedia","Vaniquotes","Vanisource","Vanimedia"];

  sel = document.createElement("select");
  sel.id = "sel_petal"; 
  sel.classList = "arrow";
  sel.onchange = () => { 
    g_focus = "";
    get_users("",true);
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

function gen_inp_filter(parent, id, func) {
  var lab, inp;

  inp = document.createElement("input");
  inp.id = id;
  inp.type = "text";
  inp.placeholder = "Filter";
  inp.classList = "myinput arrow";
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
  add_rad_button("view", "page", "Pages", true);
  add_rad_button("view", "detail", "Details", false);
}

function add_rad_button(group, value, text, checked) {
  var div, inp, lab;
  
  div = document.createElement("div");
  div.style.display = "inline-block";
  inp = document.createElement("input");
  inp.type = "radio";  
  inp.id = "but_" + value;
  inp.classList = "radio_input";
  inp.name = group; 
  inp.value = value; 
  inp.checked = checked;
  inp.onchange = () => get_users("",false);
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

function get_users(focus, reset) {
  var view, filt, url, users;
  
  if (focus) g_focus = focus; else focus = g_focus;
 
  g_reset = reset;
  view = get_view_value();
  if (view == "detail") hide_navig();
  filt = inp_filt_user.value;
  g_sel_row = null; 
  div_detail.innerHTML = "";
  div_master.innerHTML = "Data is being retrieved ...";
  
  url = 
    "/w/extensions/UserSeva/src/util.php?func=get_users&petal=" + sel_petal.value + "&filt=" + filt;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_users = data; 
      dsp_users(view,focus);
    })
    .catch(function(error) {
    });
}

async function get_pages(user, reset) {
  var url, ofs, filt, count, sort = "";
  
  filt = inp_filt_page.value;
  count = (reset && (filt || sel_nspace.value > -1));
  g_tot_records = (count ? await page_count(user,filt) : (reset ? g_users[user].tot_pages : g_tot_records));
  
  g_tot_pages = Math.ceil(g_tot_records / sel_rpp.value);
  if (reset) g_cur_page = Math.min(g_tot_pages,1);
  ofs = (Math.max(g_cur_page - 1,0) * sel_rpp.value).toString();
  sort = JSON.stringify(g_sort_options["page"][g_sort_index["page"]]);
  
  dsp_navig();
  div_detail.innerHTML = "Data is being retrieved ..."; 
  url = 
    "/w/extensions/UserSeva/src/util.php?func=get_pages&petal=" + sel_petal.value + "&user=" + user +
    "&rpp=" + sel_rpp.value + "&ofs=" + ofs + "&nspace=" + sel_nspace.value + "&filt=" + filt + "&sort=" + sort;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_pages = data; 
      dsp_pages();
    })
    .catch(function(error) {
    });
}

async function page_count(user, filt) {
  var url, count = 0;
  
  url = 
    "/w/extensions/UserSeva/src/util.php?func=page_count&petal=" + sel_petal.value + "&user=" + user +
    "&nspace=" + sel_nspace.value + "&filt=" + filt;
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      count = data; 
    })
    .catch(function(error) {
    });
  return count;
}

function gen_thead(thead, columns, panel) {
  var tr, th, sview, classes = ["fa-arrow-up","fa-arrow-down"];
  
  tr = document.createElement("tr");
  columns.forEach(column => {
    th = document.createElement("th");
    th.textContent = column[0];
    th.style.width = column[1];
    if (column[2]) {
      let i = document.createElement("i");
      g_sort_options[panel][column[3]].elem = i;
      i.classList = `fa ${classes[g_sort_options[panel][g_sort_index[panel]].sort]} arrow`;
      if (column[3] != g_sort_index[panel]) i.classList.add("hidden");
      th.appendChild(i);
      th.title = "Click to sort on this column";
      th.onclick = () => toggle_sort(column[3], i, panel);
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

function add_link(petal, row, title, clas, width) {
  var cel, a;
  cel = document.createElement("td");
  a =  document.createElement("a");
  title = g_namespaces[g_pages[row.id].nspace] + title;
  a.text  = title;
  a.href  = "https://" + (g_live_server ? "" : "dev.") + petal + ".org/wiki/" + title;
  a.target = "_blank";
  if (clas) cel.classList = clas;
  cel.style.width = width;
  cel.appendChild(a);
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
//  dsp_tot_range();
}

function handle_row_click(event, row, user) {
  var obj, view;
  
  obj = event.target;
  if (obj.classList.contains("special")) return;

  if (g_sel_row) g_sel_row.classList.remove("selrow");
  g_sel_row = row;
  row.classList.add("selrow");
  
  view = get_view_value();
  if (view == "detail") g_sync = false;
  g_focus = g_sel_row.id;
  
  if (g_sync) {
    firstHeading.textContent = "User Seva: " + g_users[g_sel_row.id].name;
    get_pages(user,g_reset);
    if (!g_reset) g_reset = true;
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