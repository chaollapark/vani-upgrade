g_languages = [];
g_focus = null;
g_sel_row = null;
g_tot_records = 0;
g_tot_pages = 0;
g_cur_page = 1;
g_tbody = null;
g_sort_options = [
  {"type": "id", "sort": 0, "elem": null},
  {"type": "code", "sort": 0, "elem": null},
  {"type": "name", "sort": 0, "elem": null},
  {"type": "english", "sort": 0, "elem": null}
];
g_sort_index = 1;

mw.hook('wikipage.content').add( function () {
  init_main();
});

function init_main() {
  init_modal();
  init_arrow();
  gen_inp_filter(div_filt_master,"inp_filt_master",() => get_master(""));
  gen_div_right();
  get_master("");
}

function gen_inp_filter(parent, id, func) {
  var lab, inp;

  inp = document.createElement("input");
  inp.id = id;
  inp.type = "text";
  inp.placeholder = "English Name";
  inp.classList = "arrow";
  inp.onchange = func;

  lab = document.createElement("label");
  lab.textContent = "Filter: ";

  parent.appendChild(lab);
  parent.appendChild(inp);
}

function get_master(focus) {
  var url, filt = "";
  
  if (!focus) focus = g_focus; else g_focus = focus;

  g_sel_row = null; 
  div_detail.innerHTML = "";
  div_master.innerHTML = "Data is being retrieved ...";
  url = 
    "/w/extensions/LangAdmin/src/util.php?func=get_master&filt=" + inp_filt_master.value;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_languages = data;
      dsp_languages(div_master, g_languages, focus, "lang_");
    })
    .catch(function(error) {
    });
}

function dsp_languages(parent, languages, focus, prefix) {
  var tbl, thead, arr, tbody, row;
  
  tbl = document.createElement("table");
  tbl.id = "tbl_languages";
  thead = document.createElement("thead");
  arr = [
    ["Id","50px",1,0],
    ["Code","75px",1,1],
    ["Name","250px",1,2],
    ["English","250px",1,3],
    ["Show","60px",0]
  ];
  gen_thead(thead, arr);
  tbody = document.createElement("tbody");
  fill_tbody(tbody, languages, prefix);

  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  parent.innerHTML = "";
  parent.appendChild(tbl);
  
  if (!focus) row = tbody.firstElementChild;
  else {
    row = document.getElementById(focus);
    if (row == null) row = tbody.firstElementChild;
  }
  row.scrollIntoView({behavior:"smooth", block:"nearest", inline:"start"});
  row.click();
}

function fill_tbody(tbody, languages, prefix) {
  var idx, row, type, sort;

  g_tbody = tbody;
  tbody.innerHTML = "";
  type = g_sort_options[g_sort_index].type;
  sort = g_sort_options[g_sort_index].sort;
  if (sort == 0) languages.sort(function(a, b)
  { if (a[type] < b[type]) return -1;
    if (a[type] > b[type]) return 1; return 0});
  else languages.sort(function(a, b)
  { if (a[type] < b[type]) return 1; 
    if (a[type] > b[type]) return -1; return 0});

  idx = 0;
  languages.forEach(lang => {
    idx++;
    let row = document.createElement("tr");
    row.id = prefix + lang.id;
    row.onclick = (event) => handle_row_click(event, row, name);
    add_cell(row, lang.id, "number_cel", "50px");
    add_cell(row, lang.code, "", "75px");
    add_cell(row, lang.name, "", "250px");
    add_cell(row, lang.english, "", "250px");
    add_checkbox(row, lang.show, "60px", lang.id);
    tbody.appendChild(row);
  });
}

function gen_thead(thead, columns) {
  var tr, th, display, classes = ["fa-arrow-up","fa-arrow-down"];
  
  tr = document.createElement("tr");
  columns.forEach(column => {
    th = document.createElement("th");
    th.textContent = column[0];
    th.style.width = column[1];
//    if ((panel != "modal") && column[2]) {
    if (column[2]) {
      let i = document.createElement("i");
      i.classList = `fa ${classes[g_sort_options[g_sort_index].sort]} arrow`;
      if (column[3] != g_sort_index) i.classList.add("hidden");
      i.style.float = "right";
      g_sort_options[column[3]].elem = i;
      th.appendChild(i);
      th.title = "Click to sort on this column";
      th.onclick = () => toggle_sort(column[3], i);
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

function add_checkbox(row, checked, width, lang_id) {
  var cel, chb;
  
  cel = document.createElement("td");
  chb = document.createElement('input'); 
  chb.classList = "special checkbox_input";
  chb.type = "checkbox"; 
  chb.checked = checked; 
  chb.onchange = () => show_lang(chb, lang_id);

  cel.style.width = width;
  cel.classList = "chb_input";
  cel.appendChild(chb);
  row.appendChild(cel);
}

function handle_row_click(event, row, key) {
  var obj, display;
  
  obj = event.target;
  if (obj.classList.contains("special")) return;

  if (g_sel_row) g_sel_row.classList.remove("selrow");
  g_sel_row = row;
  row.classList.add("selrow");
  g_focus = g_sel_row.id;
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
  row.scrollIntoView({behavior:"smooth", block:"nearest", inline:"start"});
  row.click();
}