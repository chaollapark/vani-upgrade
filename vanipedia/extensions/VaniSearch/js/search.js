function gen_titl_sheet(tabname, sheetname, label, search) {
  var div_content, inp, tgl, div, btn, sel, chb1, chb2, chb3, chb4;
  var f_change, f_clear, f_search, f_match, f_hide;

  div_content = g_tabs[tabname].sheets[sheetname].content;
  f_change = () => change_op(sheetname,sheetname);
  f_clear = () => clear_result(sheetname);
  f_search = () => search_titl(sheetname);
  f_match = () => {
    var inp_search = document.getElementById("inp_search_" + sheetname);
    var btn_search = document.getElementById("btn_search_" + sheetname);
    handle_key(event,sheetname,inp_search,btn_search);
  }
  f_hide = () => hide_help(sheetname);

  /* row 1 */
  sel = create_sel("sel_op_" + sheetname,label,null,f_change,g_options_sea,"contains_all","");
  inp = create_inp_text("inp_search_" + sheetname,search,"",48,"Search Text",null,f_match,f_clear,f_hide);
  tgl = create_tgl_match(sheetname);
  div = create_div("","content_row",null,[sel,inp,tgl]);
  div_content.appendChild(div);

  /* row 2 */
  chb1 = create_chb("chb_ww_" + sheetname,"Whole Words","",true,f_clear);
  chb2 = create_chb("chb_ds_" + sheetname,"Diacritic Sensitive","",false,f_clear);
  sel = create_sel_lang("sel_lang_" + sheetname,"Language",null,f_clear);
  div = create_div("","content_row",null,[chb1,chb2,sel]);
  div_content.appendChild(div);

  /* row 3 */
  btn = create_btn("btn_search_" + sheetname,"Search","btn_search",null,f_search);
  chb1 = create_chb("chb_vp_" + sheetname,"Vanipedia","",true,f_clear);
  chb2 = create_chb("chb_vs_" + sheetname,"Vanisource","",true,f_clear);
  chb3 = create_chb("chb_vq_" + sheetname,"Vaniquotes","",true,f_clear);
  chb4 = create_chb("chb_vm_" + sheetname,"Vanimedia","",true,f_clear);
  div = create_div("","content_row",null,[btn,chb1,chb2,chb3,chb4]);
  div_content.appendChild(div);

  /* row 4 */
  div = create_div("div_message_" + sheetname,"content_row search_message hidden",null,[]);
  div_content.appendChild(div);

  /* row 5, 6, 7 */
  gen_result_divs(div_content, sheetname, f_search);
}

function create_sel_lang(id,label,rules,onchange) {
  var div, lab, sel, opt;

  lab = create_lab(label,"","",null);
  sel = document.createElement("select");
  sel.id = id;
  sel.classList = "sel_search";
  sel.onchange = onchange;
  if (rules) Object.assign(sel.style, rules);

  opt = create_opt("All","0","",false);
  sel.appendChild(opt);
  Object.keys(g_languages).forEach(key => {
    let option = g_languages[key];
    opt = create_opt(option.name,key,"",option.name == "English");
    sel.appendChild(opt);
  });
  div = create_div("","content_unit",null,[lab,sel]);
  return div;
}

function gen_text_sheet(search) {
  var div_content, div_tab;

  div_content = g_tabs["main"].sheets["text"].content;
  div_tab = create_tab("text","sear",null,[]);
  div_content.appendChild(div_tab);
  gen_sear_sheet(search);
}

function gen_sear_sheet(search) {
  var div_content, inp, div, tgl, btn, sel, chb, info;
  var f_change, f_clear, f_search, f_match, f_hide;

  div_content = g_tabs["text"].sheets["sear"].content;
  f_change = () => change_op("text","text");
  f_clear = () => clear_result("text");
  f_search = () => search_text();
  f_match = () => handle_key(event,"text",inp_search_text,btn_search_text);
  f_hide = () => hide_help("text");
  f_rpp = () => change_rpp("text");

  /* row 1 */
  sel = create_sel("sel_op_text","Page Text",null,f_change,g_options_sea,"contains_all","");
  inp = create_inp_text("inp_search_text",search,"",48,"Search Text",null,f_match,f_clear,f_hide);
  tgl = create_tgl_match("text");
  div = create_div("","content_row",null,[sel,inp,tgl]);
  div_content.appendChild(div);

  /* row 2 */
  info = "The word proximity defines the maximal allowed distance between the matching words.";
  inp = create_spin("spin_prox_text","Word Proximity","",10,1,change_prox_text,info);
  info = "When 'Whole Words' is checked, the words from the search pattern have to match exactly with those in the text. When it is not checked, the words from the search pattern may be a substring of a larger word.";
  chb = create_chb("chb_ww_text","Whole Words","",true,change_ww_text,info);
  div = create_div("","content_row",null,[inp,chb]);
  div_content.appendChild(div);

  /* row 3 */
  info = "When the 'Whole Words' option is not checked, the match type defines how words in the text are matched with the words from the search text.";
  sel = create_sel("sel_match_op","Match Type",null,f_clear,g_options_match,"contains",info);
  info = "When the 'Whole Words' option is not checked, words from the search pattern that occur inside more dictionary words than the expansion limit (depending on the match type), will still be treated as whole words.";
  inp = create_spin("spin_explim_text","Expansion Limit","",256,1,change_explim_text,info);
  div = create_div("div_match_specs","content_row hidden",null,[sel,inp]);
  div_content.appendChild(div);

  /* row 4 */
  btn = create_btn("btn_search_text","Search","btn_search",null,f_search);
  div = create_div("","content_row",null,[btn]);
  div_content.appendChild(div);

  /* row 5 */
  div = create_div("div_message_text","content_row search_message hidden",null,[]);
  div_content.appendChild(div);

  /* row 6, 7, 8 */
  gen_result_divs(div_content, "text", f_rpp);
}

function gen_syno_sheet(search1, search2, ds) {
  var div_content, inp, left, right, div, btn, sel1, sel2, sel3, chb1, chb2, chb3;
  var f_change_orig, f_change_tran, f_clear, f_search;

  div_content = g_tabs["main"].sheets["syno"].content;
  f_change_orig = () => change_op("orig","syno");
  f_change_tran = () => change_op("tran","syno");
  f_change_book = () => book_change("syno");
  f_change_part = () => part_change("syno");
  f_keyup = (event) => input_enter(event,"btn_search_syno");
  f_clear = () => clear_result("syno");
  f_search = () => search_syno();
  f_rpp = () => change_rpp("syno");

  /* left and right blocks */
  left = create_div("","",{display: 'inline-block', 'margin-right': '10px'},[]);
  right = create_div("div_syno_right","harcdiv",null,[]);
  div_content.appendChild(left);
  div_content.appendChild(right);
  
  /* row 1 */
  sel1 = create_sel("sel_op_orig","Sanskrit or Bengali",null,f_change_orig,g_options_sea,"contains_all","");
  inp = create_inp_text("search_syno_orig",search1,"",36,"Search Text",null,null,f_clear,null);
  inp.onkeyup = f_keyup;
  div = create_div("","content_row",null,[sel1,inp]);
  left.appendChild(div);

  /* row 2 */
  sel1 = create_sel("sel_op_tran","English",null,f_change_tran,g_options_sea,"contains_all","");
  inp = create_inp_text("search_syno_tran",search2,"",36,"Search Text",null,null,f_clear,null);
  inp.onkeyup = f_keyup;
  div = create_div("","content_row",null,[sel1,inp]);
  left.appendChild(div);

  /* row 3 */
  chb1 = create_chb("chb_ww_orig","Whole Words (Sanskrit or Bengali)","",true,f_clear);
  chb2 = create_chb("chb_ww_tran","Whole Words (English)","",true,f_clear);
  chb3 = create_chb("chb_ds_syno","Diacritic Sensitive","",ds,f_clear);
  div = create_div("","content_row",null,[chb1,chb2,chb3]);
  left.appendChild(div);

  /* row 4 */
  btn = create_btn("btn_search_syno", "Search", "btn_search", null, f_search);
  sel1 = create_sel_vani(g_books,"sel_book_syno","Book",null,f_change_book,"")
  sel2 = create_sel_vani(g_parts,"sel_part_syno","Part",null,f_change_part,"hidden")
  sel3 = create_sel_vani(g_chaps,"sel_chap_syno","Chapter",null,f_clear,"hidden")
  div = create_div("","content_row",null,[btn,sel1,sel2,sel3]);
  left.appendChild(div);

  /* row 5 */
  div = create_div("div_message_syno","content_row search_message hidden",null,[]);
  left.appendChild(div);

  /* row 6, 7, 8*/
  gen_result_divs(left, "syno", f_search);
}

function gen_line_sheet(search) {
  var div_content, inp, div, btn, sel1, sel2, sel3, chb1, chb2;
  var f_change, f_clear, f_search;

  div_content = g_tabs["main"].sheets["line"].content;
  f_change = () => change_op("line","line");
  f_change_book = () => book_change("line");
  f_change_part = () => part_change("line");
  f_keyup = (event) => input_enter(event,"btn_search_line");
  f_clear = () => clear_result("line");
  f_search = () => search_line();
  //f_rpp = () => change_rpp("line");

  /* row 1 */
  sel1 = create_sel("sel_op_line","Sanskrit or Bengali",null,f_change,g_options_sea,"contains_all","");
  inp = create_inp_text("search_line",search,"",36,"Search Text",null,null,f_clear,null);
  inp.onkeyup = f_keyup;
  div = create_div("","content_row",null,[sel1,inp]);
  div_content.appendChild(div);

  /* row 2 */
  chb1 = create_chb("chb_ww_line","Whole Words","",true,f_clear);
  chb2 = create_chb("chb_ds_line","Diacritic Sensitive","",false,f_clear);
  div = create_div("","content_row",null,[chb1,chb2]);
  div_content.appendChild(div);

  /* row 3 */
  btn = create_btn("btn_search_line", "Search", "btn_search", null, f_search);
  sel1 = create_sel_vani(g_books,"sel_book_line","Book",null,f_change_book,"");
  sel2 = create_sel_vani(g_parts,"sel_part_line","Part",null,f_change_part,"hidden")
  sel3 = create_sel_vani(g_chaps,"sel_chap_line","Chapter",null,f_clear,"hidden")
  div = create_div("","content_row",null,[btn,sel1,sel2,sel3]);
  div_content.appendChild(div);

  /* row 4 */
  div = create_div("div_message_line","content_row search_message hidden",null,[]);
  div_content.appendChild(div);

  /* row 5, 6, 7 */
  gen_result_divs(div_content, "line", f_search);
}

function gen_trns_sheet(search) {
  var div_content, inp, div, btn, sel, chb1, chb2;
  var f_change, f_clear, f_search;

  div_content = g_tabs["main"].sheets["trns"].content;
  f_change = () => change_op("trns","trns");
  f_keyup = (event) => input_enter(event,"btn_search_trns");
  f_clear = () => clear_result("trns");
  f_search = () => search_trns();
  //f_rpp = () => change_rpp("line");

  /* row 1 */
  sel = create_sel("sel_op_trns","Translation",null,f_change,g_options_sea,"contains_all","");
  inp = create_inp_text("search_trns",search,"",36,"Search Text",null,null,f_clear,null);
  inp.onkeyup = f_keyup;
  div = create_div("","content_row",null,[sel,inp]);
  div_content.appendChild(div);

  /* row 2 */
  chb1 = create_chb("chb_ww_trns","Whole Words","",true,f_clear);
  chb2 = create_chb("chb_ds_trns","Diacritic Sensitive","",false,f_clear);
  div = create_div("","content_row",null,[chb1,chb2]);
  div_content.appendChild(div);

  /* row 3 */
  btn = create_btn("btn_search_trns", "Search", "btn_search", null, f_search);
  sel = create_sel_vani(g_books,"sel_book_trns","Book",null,f_clear,"");
  div = create_div("","content_row",null,[btn,sel]);
  div_content.appendChild(div);

  /* row 4 */
  div = create_div("div_message_trns","content_row search_message hidden",null,[]);
  div_content.appendChild(div);

  /* row 5, 6, 7 */
  gen_result_divs(div_content, "trns", f_search);
}

function gen_result_divs(parent, sheetname, rpp_func) {
  var div_head, div_body, div_foot;
  div_head = create_div_headfoot(sheetname, true, rpp_func);
  div_body = create_div("div_result_" + sheetname,"content_row",null,[]);
  div_foot = create_div_headfoot(sheetname, false, rpp_func);
  parent.appendChild(div_head);
  parent.appendChild(div_body);
  parent.appendChild(div_foot);
}

function create_div_headfoot(sheetname, top, func) {
  var div_hf, div, sel = null;

  div = create_div_navig(sheetname);
  if (top) sel = create_sel("sel_rpp_" + sheetname,"Records per page",null,func,g_options_rpp,"50","");
  div_hf = create_div("","content_row",null,[div, sel]);
  return div_hf;
}

function create_div_navig(sheetname) {
  var div_nav, div1, div2, div3, div4, div5, div6;
  div1 = create_div("","content_unit",{'margin-right':'3px'},[]);
  div1.textContent = "Total Records:";
  div2 = create_div("","content_unit tot_records",null,[]);
  div2.textContent = "0";
  div3 = create_div("","content_unit",{'margin-right':'3px'},[]);
  div3.textContent = "Page:";
  div4 = create_div("","content_unit cur_page",{'margin-right':'0px'},[]);
  div4.textContent = "0";
  div5 = create_div("","content_unit tot_pages",null,[]);
  div5.textContent = "/0";
  div6 = create_div_navbuttons(sheetname);
  div_nav = create_div("","div_navig content_unit hidden",null,[div1, div2, div3, div4, div5, div6]);
  return div_nav;
}

function create_div_navbuttons(sheetname) {
  var div, btn1, btn2, btn3, btn4, icon, func;

  icon = create_icon("fas fa-angle-left", "Previous", null);
  btn1 = create_btn("", "", "", null, () => prev_page(sheetname));
  btn1.appendChild(icon);

  icon = create_icon("fas fa-angle-right", "Next", null);
  btn2 = create_btn("", "", "", null, () => next_page(sheetname));
  btn2.appendChild(icon);

  icon = create_icon("fas fa-angle-double-left", "First", null);
  btn3 = create_btn("", "", "", null, () => first_page(sheetname));
  btn3.appendChild(icon);

  icon = create_icon("fas fa-angle-double-right", "Last", null);
  btn4 = create_btn("", "", "", null, () => last_page(sheetname));
  btn4.appendChild(icon);

  div = create_div("","nav_buttons content_unit",null,[btn1,btn2,btn3,btn4]);
  return div;
}
// <button title="Previous" onclick="if (!window.__cfRLUnblockHandlers) return false; nav_prev()"><i class="fa fa-angle-left"></i></button>

/* todo: merge create_sel functions into one */
function create_sel_vani(data,id,label,rules,onchange,cls) {
  var div, lab, sel, opt;

  lab = create_lab(label,"","",null);
  sel = document.createElement("select");
  sel.id = id;
  sel.classList = "sel_search";
  sel.onchange = onchange;
  if (rules) Object.assign(sel.style, rules);

  opt = create_opt("All","0","",false);
  sel.appendChild(opt);
  Object.keys(data).forEach(key => {
    let option = data[key];
    opt = create_opt(option.name,key,"",false);
    sel.appendChild(opt);
  });
  div = create_div("",`content_unit ${cls}`,null,[lab,sel]);
  return div;
}

function create_tgl_match(type) {
  var btn, icon, func, cls;

  func = () => {
    var icons, i;
    g_word_match[type].active = !g_word_match[type].active;
    icons = g_word_match[type].button.getElementsByTagName("i")
    for (i = 0; i < icons.length; i++) {
      icons[i].classList.toggle("hidden");
    }
  };

  btn = create_btn("","","btn_toggle",null,func);
  g_word_match[type].button = btn;
  cls = (g_word_match[type].active ? "" : "hidden");
  icon = create_icon("far fa-toggle-on " + cls, "Switch word match off", null);
  btn.appendChild(icon);
  cls = (g_word_match[type].active ? "hidden" : "");
  icon = create_icon("far fa-toggle-off " + cls, "Switch word match on", null);
  btn.appendChild(icon);
  return btn;
}


function change_ww_text() {
  if (chb_ww_text.checked) div_match_specs.classList.add('hidden');
  else div_match_specs.classList.remove('hidden');
  clear_result("text");
}

function change_prox_text() {
  if (spin_prox_text.value <= 0) spin_prox_text.value = 1;
  else if (spin_prox_text.value >= 100) spin_prox_text.value = 99;
  clear_result("text");
}

function change_explim_text() {
  if (spin_explim_text.value <= 0) spin_explim_text.value = 1;
  else if (spin_explim_text.value >= 1000) spin_explim_text.value = 999;
  clear_result("text");
}

function toggle_help() {
  div_help_wrapper.classList.toggle("hidden");
}

function input_enter(event,button) {
  event.preventDefault();
  if (event.keyCode == 13) 
    document.getElementById(button).click();
}