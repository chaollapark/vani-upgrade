var g_vanitypes = {};
var g_vanis = {};
var g_vtyp_id = 0;
var g_vtyp_data = {};
var g_vani_data = {};
var g_select_all = true;

async function init_vanifilt() {
  await get_vanitypes();
  await get_vanis();
  gen_vani_filt();
}

async function get_vanitypes() {
  var url;

  url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_vanitypes";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_vanitypes = data;
      g_vtyp_id = Object.keys(g_vanitypes)[0];
    })
    .catch(function(error) {
    });
}

async function get_vanis() {
  var url;

  url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_vanis";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_vanis = data;
      gen_vani_data();
    })
    .catch(function(error) {
    });
}

function gen_vani_filt() {
  var div, tbl, div_vani_filt;

  div_vani_filt = g_tabs["text"].sheets["filt"].content;
  div = xcreate_div("div_vtyp_table","vn_table_div");
  tbl = xcreate_vtyp_table();
  div.appendChild(tbl);
  div_vani_filt.appendChild(div);

  div = xcreate_div("div_vani_table","vn_table_div");
  div_vani_filt.appendChild(div);
//  alert(108);
  g_vtyp_data[g_vtyp_id].row.click();
}

function gen_vani_data() {
  var vanis;

  vanis = Object.keys(g_vanis);
  vanis.forEach(vani_id => {
    g_vani_data[vani_id] = {"selected": true};
  });
}

function xcreate_vtyp_table() {
  var vanitypes, tbl, bdy, row, cel, lab, but, i;

  tbl = create_tbl("tbl_vtyp","filt_table");
  bdy = document.createElement('tbody');
  vanitypes = Object.keys(g_vanitypes);
  vanitypes.forEach(vtyp_id => {
    let vtyp = g_vanitypes[vtyp_id];
    let chb_id = "chb_vtyp_" + vtyp_id;
    row = document.createElement('tr');

    cel = document.createElement('td');
    let chb = xcreate_chb(chb_id,"",true,() => select_all_vani(chb, vtyp_id));
    chb.classList = "special";
    cel.appendChild(chb);
    row.appendChild(cel);

    cel = document.createElement('td');
    cel.textContent = vtyp.name;
    row.appendChild(cel);

    row.onclick = (event) => select_vtyp(event, vtyp_id);
    g_vtyp_data[vtyp_id] = {"row": row, "checkbox": chb};
    bdy.appendChild(row);
  });
  tbl.appendChild(bdy);
  return tbl;
}

function xcreate_vani_table(vtyp_id) {
  var vanis, tbl, bdy, row, cel, lab, but, i;

  tbl = create_tbl("tbl_vani","filt_table");
  bdy = document.createElement('tbody');
  vanis = Object.keys(g_vanis).filter((vani_id) => {
    return g_vanis[vani_id].vtyp_id == vtyp_id;
  });
  vanis.sort(function(a, b) {
    if (g_vanis[a].name < g_vanis[b].name) return -1; if (g_vanis[a].name > g_vanis[b].name) return 1; return 0;
  });
  vanis.forEach(vani_id => {
    let vani = g_vanis[vani_id];
    let chb_id = "chb_vani_" + vani_id;
    row = document.createElement('tr');

    cel = document.createElement('td');
    let chb = xcreate_chb(chb_id,"",g_vani_data[vani_id].selected,() => select_one_vani(chb, vani_id));
    cel.appendChild(chb);
    row.appendChild(cel);

    cel = document.createElement('td');
    cel.textContent = vani.name;
    row.appendChild(cel);

    bdy.appendChild(row);
  });
  tbl.appendChild(bdy);
  return tbl;
}

function select_all_vani(chb, vtyp_id) {
  var vanis, checkboxes;

  if (!g_select_all) { g_select_all = true; return; }

  vanis = Object.keys(g_vanis);
  vanis.forEach(vani_id => {
    if (g_vanis[vani_id].vtyp_id == vtyp_id) {
      g_vani_data[vani_id].selected = chb.checked;
    }
  });

  if (vtyp_id == g_vtyp_id) {
    checkboxes = Array.from(tbl_vani.getElementsByTagName("input"));
    checkboxes.forEach((box) => {
      box.checked = chb.checked;
    });
  }
  clear_result("text");
}

function select_one_vani(chb, vani_id) {
  var vanis, vtyp_id, count = 0;

  g_vani_data[vani_id].selected = chb.checked;
  vtyp_id = g_vanis[vani_id].vtyp_id;
  if (chb.checked && !g_vtyp_data[vtyp_id].checkbox.checked) {
    g_select_all = false;
    g_vtyp_data[vtyp_id].checkbox.click();
  }
  if (!chb.checked && g_vtyp_data[vtyp_id].checkbox.checked) {
    vanis = Object.keys(g_vanis);
    vanis.forEach(vani_id => {
      if ((g_vanis[vani_id].vtyp_id == vtyp_id) && g_vani_data[vani_id].selected)
        count++;
    });
    if (count == 0) {
      g_select_all = false;
      g_vtyp_data[vtyp_id].checkbox.click();
    }
  }
  clear_result("text");
}

function select_vtyp(event, vtyp_id) {
  var obj,tbl;
  obj = event.target;
  if (obj.classList.contains("special")) return;

  g_vtyp_data[g_vtyp_id].row.classList.remove("selrow");
  g_vtyp_id = vtyp_id;
  g_vtyp_data[vtyp_id].row.classList.add("selrow");

  tbl = xcreate_vani_table(vtyp_id);
  div_vani_table.innerHTML = "";
  div_vani_table.appendChild(tbl);
}

function xcreate_but(vtyp_id, onclick) {
  var but;
  but = document.createElement('button');
  but.onclick = onclick;
  return but;
}

function xcreate_div(id, cls) {
  var div;
  div = document.createElement('div');
  div.id = id;
  div.classList = cls;
  return div;
}

function add_cell(row, text, cls, width) {
  var cel;
  cel = document.createElement("td");
  cel.textContent = text;
  if (clas) cel.classList = cls;
  cel.style.width = width;
  row.appendChild(cel);
}

function xcreate_lab(txt) {
  var lab;
  lab = document.createElement("label");
  lab.textContent = txt;
  return lab;
}

function xcreate_i(cls) {
  var i;
  i = document.createElement("i");
  i.classList = cls;
  return i;
}

function xcreate_chb(id,title,checked,onchange) {
  var chb;
  chb = document.createElement("input");
  chb.type = "checkbox";
  chb.id = id;
  chb.title = title;
  chb.checked = checked;
  chb.onchange = onchange;
  return chb;
}
