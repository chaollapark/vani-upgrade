function create_sel(id,label,rules,onchange,options,select,info) { /* todo: this is a specific create_sel, but has a general name */
  var div, lab, sel, opt, icon = null;

  lab = create_lab(label,"","",null);
  sel = document.createElement("select");
  sel.id = id;
  sel.classList = "sel_search";
  sel.onchange = onchange;
  if (rules) Object.assign(sel.style, rules);

  Object.keys(options).forEach(value => {
    let option = options[value];
    if (("exclude" in option) && option.exclude.includes(id)) return;
    opt = create_opt(option.caption,value,option.tooltip);
    if (value == select) sel.title = option.tooltip;
    sel.appendChild(opt);
  });
  sel.value = select;

  if (info) icon = create_icon("far fa-question-circle", info, {'margin-left':'3px'});
  div = create_div("","content_unit",null,[lab,sel,icon]);
  return div;
}

function create_opt(caption,value,tooltip,selected) {
  var opt;
  opt = document.createElement("option");
  opt.textContent = caption;
  opt.value = value;
  opt.title = tooltip;
  if (selected) opt.selected = true;
  return opt;
}

function create_lnk(id,href,target,text) {
  var lnk;
  lnk = document.createElement("a");
  lnk.id = id;
  lnk.href = href;
  lnk.target = target;
  lnk.textContent = text;
  return lnk;
}

function create_div(id, cls, rules, children) {
  var div;
  div = document.createElement("div");
  if (id) div.id = id;
  if (cls) div.classList = cls;
  if (rules) Object.assign(div.style, rules);
  children.forEach(child => {if (child) div.appendChild(child)});
  return div;
}

function create_btn(id, caption, cls, rules, func) {
  var btn;
  btn = document.createElement("button");
  if (id) btn.id = id;
  btn.textContent = caption;
  if (cls) btn.classList = cls;
  btn.onclick = func;
  if (rules) Object.assign(btn.style, rules);
  return btn;
}

function create_lab(caption, htmlfor, cls, rules) {
  var lab;
  lab = document.createElement("label");
  lab.textContent = caption;
  if (htmlfor) lab.htmlFor = htmlfor;
  if (cls) lab.classList = cls;
  if (rules) Object.assign(lab.style, rules);
  return lab;
}

function create_icon(cls, tooltip, rules) {
  var icon;
  icon = document.createElement("i");
  icon.classList = cls;
  icon.title = tooltip;
  if (rules) Object.assign(icon.style, rules);
  return icon;
}

function create_inp_text(id,value,cls,size,placeholder,rules,onkeydown,oninput,onblur) {
  var inp;
  inp = document.createElement("input");
  inp.type = "text";
  inp.id = id;
  if (cls) inp.classList = cls;
  inp.value = value;
  inp.size = size;
  inp.placeholder = placeholder;
  if (onkeydown) inp.onkeydown = onkeydown;
  if (oninput) inp.oninput = oninput;
  if (onblur) inp.onblur = onblur;
  if (rules) Object.assign(inp.style, rules);
  return inp;
}

function create_inp_check(id,tooltip,checked,onchange) {
  var inp;
  inp = document.createElement("input");
  inp.type = "checkbox";
  inp.id = id;
  inp.title = tooltip;
  inp.checked = checked;
  inp.onchange = onchange;
  return inp;
}

function create_inp_num(id,cls,tooltip,value,step,onchange) {
  var inp;
  inp = document.createElement("input");
  inp.type = "number";
  inp.id = id;
  inp.classList = cls;
  inp.title = tooltip;
  inp.value = value;
  inp.step = step;
  inp.onchange = onchange;
  return inp;
}

function create_chb(id,label,tooltip,checked,onchange,info) {
  var div, lab, inp, icon = null;

  lab = create_lab(label,id,"forcheckbox",null);
  inp = create_inp_check(id,tooltip,checked,onchange);
  if (info) icon = create_icon("far fa-question-circle", info, null);
  div = create_div("","content_unit",null,[lab,inp,icon]);
  return div;
}

function create_spin(id,label,tooltip,value,step,onchange,info) {
  var div, lab, inp, icon = null;

  lab = create_lab(label,id,"",null);
  inp = create_inp_num(id,"spin_search",tooltip,value,step,onchange);
  if (info) icon = create_icon("far fa-question-circle", info, {'margin-left':'3px'});
  div = create_div("","content_unit",null,[lab,inp,icon]);
  return div;
}

function create_element(id,tag,text,cls,rules) {
  var elem;
  elem = document.createElement(tag);
  elem.id = id;
  elem.textContent = text;
  elem.classList = cls;
  if (rules) Object.assign(elem.style, rules);
  return elem;
}

function create_tab(tabname, current, rules, subtabs) {
  var tab, div1, div2, btn, id, cls, func, is_current;
  tab = g_tabs[tabname];
  tab.current = current;
  tab.elem = create_div("div_tab_" + tabname, "div_tab", rules, []);
  div1 = create_div("","tabs_container",null,[]);
  tab.elem.appendChild(div1);

  Object.keys(tab.sheets).forEach(sheetname => {
    let sheet = tab.sheets[sheetname];
    is_current = (sheetname == current);

    /* tab_button */
    id = "tab_btn_" + sheetname;
    cls = "tab_button" + (is_current ? " active" : "");
    btn = create_btn(id, sheet.caption, cls, null, () => {tab_select(tabname, sheetname)});
    sheet.button = btn;
    div1.appendChild(btn);

    /* tab content*/
    id = "tab_div_" + sheetname;
    cls = "sheet_content" + (is_current ? " active" : "") + (subtabs.includes(sheetname) ? " subtab": "");
    div2 = create_div(id, cls, null, []);
    sheet.content = div2;
    tab.elem.appendChild(div2);
  });
  return tab.elem;
}

function tab_select(tabname, sheetname, exec=false) {
  var current, sheets, btn;
  current = g_tabs[tabname].current;
  sheets = g_tabs[tabname].sheets;
  if (current) {
    sheets[current].button.classList.toggle("active");
    sheets[current].content.classList.toggle("active");
  }
  sheets[sheetname].button.classList.toggle("active");
  sheets[sheetname].content.classList.toggle("active");
  g_tabs[tabname].current = sheetname;

  if (tabname == "main") {
    lnk_help_search.textContent = "Help " + g_search_data[sheetname].name + " Search";
  } 
  if ((sheetname == "syno" || (sheetname == "line")) && (Object.keys(g_parts).length === 0)) {
    get_parts(); get_chaps();
  }
  if ((sheetname == "syno") && !g_hierarchy) {
    g_hierarchy = new HierArchy(); 
  }

  if (exec) {
    btn = document.getElementById("btn_search_" + sheetname);
    btn.click();
  }
}

