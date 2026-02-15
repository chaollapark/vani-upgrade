g_pages = [];
g_range = [];
g_tot_records = 0;
g_tot_pages = 0;
g_cur_page = 1;
g_sel_row = null;
g_sort_options = [{"type": "rev", "sort": 1},{"type": "space", "sort": 1}];
g_sort_index = 1;
g_col_header = {0: "Page Title", 14: "Category Name"};

mw.hook('wikipage.content').add( function () {
  init_main();
});

function init_main() {
  init_arrow();
  gen_sel_petal();
  gen_sel_rpp();
  gen_rad_nspace();
  gen_rad_type();
  gen_div_total();
  gen_div_navig();
  //gen_div_right();
  sel_petal.onchange();
  /* TODO */ but_del_hist.disabled = 1;
}

function recomp() { 
  clear_range();
  get_total(); 
  get_pages(true, false);
};

function gen_sel_petal() {
  var sel, lab, opt, petals = ["Vanipedia","Vaniquotes","Vanisource"];

  sel = document.createElement("select");
  sel.id = "sel_petal"; 
  sel.onchange = recomp;

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

function gen_rad_nspace() {
  var lab;
  lab = document.createElement("label");
  lab.textContent = "Type: ";
  div_rad_nspace.appendChild(lab);
  add_rad_button(div_rad_nspace,"nspace", "0", "Page", true, recomp);
  add_rad_button(div_rad_nspace,"nspace", "14", "Category", false, recomp);
}

function gen_rad_type() {
  var lab;
  lab = document.createElement("label");
  lab.textContent = "Display: ";
  div_rad_type.appendChild(lab);
  add_rad_button(div_rad_type,"type", "one", "Latest revision", true, () => get_pages(true, false));
  add_rad_button(div_rad_type,"type", "all", "All revisions", false, () => get_pages(true, false));
}

function add_rad_button(parent,group, value, text, checked, func) {
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
  inp.onchange = func;
  div.appendChild(inp);
  
  lab = document.createElement("label");
  lab.htmlFor = inp.id; 
  lab.textContent = text;
  div.appendChild(lab);
  parent.appendChild(div);
}

function gen_sel_rpp() {
  var sel, lab, opt, numbers = ["25","50","100","250","500","1000","2500"];

  sel = document.createElement("select");
  sel.id = "sel_rpp"; 
  sel.onchange = () => get_pages(false, true);

  numbers.forEach(number => {
    opt = document.createElement("option");
    opt.value = number; opt.textContent = number;
    sel.appendChild(opt);
  });

  lab = document.createElement("label");
  lab.textContent = "  Records per page: ";

  div_sel_petal.appendChild(lab);
  div_sel_petal.appendChild(sel);
}

function gen_div_navig() {
  var spn1, spn2, spn3, spn4, lab1, lab2, txt3, div;
  
  spn1 = document.createElement("span");
  lab1 = document.createElement("label");
  lab1.textContent = " Total Records: ";
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
  
  div = document.createElement("div");
  div.id = "div_buttons";
  gen_div_buttons(div);
  
  div_navig.appendChild(spn1);
  div_navig.appendChild(div);
}

function gen_div_total() {
  var spn1, spn2, lab;
  
  spn1 = document.createElement("span");
  lab = document.createElement("label");
  lab.textContent = "Total Space: ";
  spn2 = document.createElement("span");
  spn2.id = "spn_tot_space";

  spn1.appendChild(lab);
  spn1.appendChild(spn2);
  gen_sel_unit(spn1, "sel_unit_total", () => dsp_tot_space());

  div_total.appendChild(spn1);
}

function gen_div_buttons(div) {
  var but, i;
  
  but = document.createElement("button");
  but.title = "Previous";
  but.onclick = () => nav_prev();
  i = document.createElement("i");
  i.classList = "fa fa-angle-left";
  but.appendChild(i);
  div.appendChild(but);
  
  but = document.createElement("button");
  but.title = "Next";
  but.onclick = () => nav_next();
  i = document.createElement("i");
  i.classList = "fa fa-angle-right";
  but.appendChild(i);
  div.appendChild(but);
  
  but = document.createElement("button");
  but.title = "First";
  but.onclick = () => nav_first();
  i = document.createElement("i");
  i.classList = "fa fa-angle-double-left";
  but.appendChild(i);
  div.appendChild(but);
  
  but = document.createElement("button");
  but.title = "Last";
  but.onclick = () => nav_last();
  i = document.createElement("i");
  i.classList = "fa fa-angle-double-right";
  but.appendChild(i);
  div.appendChild(but);
}

function get_pages(count, reset) {
  var nspace, type, ofs, sort, url;
  
  g_sel_row = null; 
  div_history.innerHTML = "";
  div_table.innerHTML = "Data is being retrieved ...";
  
  nspace = get_radio_val(div_rad_nspace);
  type = get_radio_val(div_rad_type);
  
  if (reset) g_cur_page = 1; 
  /* NB count implies reset and reset implies !count */

  if (count) {
    g_cur_page = 1;
    count_navig(nspace,type);
  }
  else {
    g_tot_pages = Math.ceil(g_tot_records / sel_rpp.value);
    dsp_navig();
  }
  
  ofs = ((g_cur_page - 1) * sel_rpp.value).toString();
  sort = JSON.stringify(g_sort_options[g_sort_index]);
  url = 
    "/w/extensions/RevisionManager/src/util.php?func=get_pages&petal=" + sel_petal.value + 
    "&nspace=" + nspace + "&type=" + type + "&rpp=" + sel_rpp.value + "&ofs=" + ofs + "&sort=" + sort;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_pages = data;
      dsp_pages();
    })
    .catch(function(error) {
    });
}

/* async? */
function count_navig(nspace,type) {
  var url = "/w/extensions/RevisionManager/src/util.php?func=get_count&petal=" + sel_petal.value + "&nspace=" + nspace + "&type=" + type;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_tot_records = data;
      g_tot_pages = Math.ceil(g_tot_records / sel_rpp.value);
      g_cur_page = Math.min(g_tot_records, 1);
      dsp_navig();
    })
    .catch(function(error) {
    });  
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


function dsp_pages() {
  var tbl, thead, tbody, idx, cel, size, nspace;
  
  nspace = get_radio_val(div_rad_nspace);
  
  tbl = document.createElement("table");
  tbl.id = "tbl_pages";
  thead = document.createElement("thead");
  gen_thead(thead, [
    ["#","50px",0],
    [g_col_header[nspace],"450px",0],
    ["Rev.","50px",1,0],
    ["Space","90px",1,1],
    ["Sel.","40px",0]
  ]);

  tbody = document.createElement("tbody");
  idx = (g_cur_page - 1) * sel_rpp.value;
  g_pages.forEach(page => {
    idx++;
    let row = document.createElement("tr");
    row.id = page.id;
    row.onclick = (event) => handle_row_click(event, row, page.id);

    add_cell(row, idx, "number_cel", "50px");
    add_cell(row, page.title, "", "450px");
    add_cell(row, page.count, "number_cel", "50px");
    size = new Intl.NumberFormat('en-US', {style: 'decimal'}).format(page.size);
    add_cell(row, size, "number_cel", "90px");
    add_checkbox(row, page.id, "40px");
    tbody.appendChild(row);
  });
  tbl.appendChild(thead);
  tbl.appendChild(tbody);
  div_table.innerHTML = "";
  div_table.appendChild(tbl);
}

function gen_thead(thead, columns) {
  var tr, th, classes = ["fa-arrow-up","fa-arrow-down"];
  
  tr = document.createElement("tr");
  columns.forEach(column => {
    th = document.createElement("th");
    th.textContent = column[0];
    th.style.width = column[1];
    if (column[2]) {
      let i = document.createElement("i");
      i.classList = `fa ${classes[g_sort_options[g_sort_index].sort]} arrow`;
      if (column[3] != g_sort_index) i.classList.add("hidden");
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

function add_checkbox(row, page_id, width) {
  var cel, chb;
  
  cel = document.createElement("td");
  chb = document.createElement('input'); 
  chb.classList = "special checkbox_input";
  chb.type = "checkbox"; 
  chb.checked = g_range.includes(page_id); 
  chb.onchange = () => set_range(chb, page_id);

  cel.style.width = width;
  cel.classList = "chb_input";
  cel.appendChild(chb);
  row.appendChild(cel);
}

function set_range(chb, page_id) {
  var includes = g_range.includes(page_id);
  if (chb.checked && !includes) 
    g_range.push(page_id);
  else if (!chb.checked && includes)
    g_range = g_range.filter(item => item !== page_id);
  dsp_tot_range();
  get_space_gain();
}

function handle_row_click(event, row, page_id) {
  var obj = event.target;
  if (obj.classList.contains("special")) return;

  if (g_sel_row) g_sel_row.classList.remove("selrow");
  g_sel_row = row;
  row.classList.add("selrow");
  get_history(page_id);
}

function nav_prev() {
  if (g_cur_page == 1) return;
  g_cur_page--;
  get_pages(false, false);
}

function nav_next() {
  if (g_cur_page == g_tot_pages) return;
  g_cur_page++;
  get_pages(false, false);
}

function nav_first() {
  g_cur_page = 1;
  get_pages(false, false);
}

function nav_last() {
  g_cur_page = g_tot_pages;
  get_pages(false, false);
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