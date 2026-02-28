var g_feedbacks = {};
var g_countries = {};
var g_fdbk_loaded = false;
var g_fdbk_id = 0;
var g_fdbk_data = {};

async function feedback() {
  var tbl, frm, btn1, btn2, btn3, div_contain, div_display, div_table, div_text, div_mesg, div_form;
  
  toggle_fdbk();
  if (!g_fdbk_loaded) {
    await get_feedbacks();
    await get_countries();
    tbl = create_fdbk_table();
    frm = create_fdbk_form();
    btn1 = create_btn("", "Provide Feedback", "btn_search", null, provide_feedback);
    btn2 = create_btn("", "Submit Feedback", "btn_search", null, submit_feedback);
    btn3 = create_btn("", "Cancel", "btn_search", null, cancel_feedback);
    div_table = create_div("div_fdbk_table","",null,[tbl]);
    div_text = create_div("div_fdbk_text","",null,[]);
    div_mesg = create_div("div_fdbk_mesg","",null,[]);
    div_display = create_div("div_fdbk_display","",{'display':'block'},[div_table,div_text,btn1]);
    div_form = create_div("div_fdbk_form","",{'display':'none'},[frm,div_mesg,btn2,btn3]);
    div_contain = create_div("div_fdbk_contain","",null,[div_display,div_form]);
    div_fdbk_content.appendChild(div_contain);
    
    if (g_fdbk_id) {
      g_fdbk_data[g_fdbk_id].row.click();
      div_table.scrollTop = 0;
    }
  }
}

async function get_feedbacks() {
  var url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_feedbacks";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_feedbacks = data;
      g_fdbk_loaded = true;
    })
    .catch(function(error) {
    });
}

async function get_fdbk_text(fdbk_id) {
  var url, result = "";
  url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_fdbk_text&fdbk_id=" + fdbk_id;
  await fetch(url)
    .then((resp) => resp.text())
    .then((text) => {
      result = text;
    })
    .catch(function(error) {
    });
  return result;
}

async function get_countries() {
  var url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_countries";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_countries = data;
    })
    .catch(function(error) {
    });
}

function create_fdbk_table() {
  var feedbacks, tbl, head, body, row, cel1, cel2, cel3, cel4, cel5, favorite;

  tbl = create_tbl("tbl_fdbk","fdbk","760px");
  cel1 = create_cel("th","","Time","175px");
  cel2 = create_cel("th","","Name","200px");
  cel3 = create_cel("th","","Country","200px");
  cel4 = create_cel("th","","Rating","65px");
  cel5 = create_cel("th","","Favorite","100px");
  head = create_head([cel1,cel2,cel3,cel4,cel5]);
  body = create_body();
  tbl.appendChild(head);
  tbl.appendChild(body);

  feedbacks = Object.keys(g_feedbacks);
  feedbacks.sort(function(a, b){if (g_feedbacks[a].time < g_feedbacks[b].time) return 1; if (g_feedbacks[a].time > g_feedbacks[b].time) return -1; return 0});
  feedbacks.forEach(fdbk_id => {
    let fdbk = g_feedbacks[fdbk_id];
    favorite = (fdbk.favorite == "none" ? "None" : g_tabs["main"].sheets[fdbk.favorite].caption);
    cel1 = create_cel("td","",fdbk.time,"175px");
    cel2 = create_cel("td","",fdbk.name,"200px");
    cel3 = create_cel("td","",fdbk.country,"200px");
    cel4 = create_cel("td","number_cel",fdbk.rating,"65px");
    cel5 = create_cel("td","",favorite,"100px");
    row = create_row([cel1,cel2,cel3,cel4,cel5]);
    row.onclick = (event) => select_fdbk(event, fdbk_id);
    g_fdbk_data[fdbk_id] = {"row": row};
    body.appendChild(row);
  });

  g_fdbk_id = (feedbacks.length ? feedbacks[0] : 0); 
  return tbl;
}

function create_fdbk_form() {
  var div_form, div1, div2, div3, div4, div5, div6, div, lab, inp, sel, info, icon;
  
  lab = create_lab("Name:","","",null);
  div = create_div("","",{'display':'inline-block', 'width':'60px'},[lab]);
  inp = create_inp_text("inp_fdbk_name","","fdbk_text_input arrow",24,"Name",null,null,null,null);
  div1 = create_div("","fdbk_form_row",null,[div,inp]);
  
  lab = create_lab("Country:","","",null);
  div = create_div("","",{'display':'inline-block', 'width':'60px'},[lab]);
  sel = create_sel_cntr("sel_fdbk_cntr","fdbk_text_input",{'width':'220px'});
  div2 = create_div("","fdbk_form_row",null,[div,sel]);

  lab = create_lab("Email:","","",null);
  div = create_div("","",{'display':'inline-block', 'width':'60px'},[lab]);
  inp = create_inp_text("inp_fdbk_email","","fdbk_text_input arrow",24,"Email address",null,null,null,null);
  info = "Your email address will not be visible or shared, but might be used by us to reply to your feedback";
  icon = create_icon("far fa-question-circle", info, {'margin-left':'3px'});
  div3 = create_div("","fdbk_form_row",null,[div,inp,icon]);
  
  lab = create_lab("Rating:","","",null);
  div = create_div("","",{'display':'inline-block', 'width':'60px'},[lab]);
  inp = create_inp_num("spin_fdbk_rating","spin_fdbk fdbk_text_input arrow","",0,1,change_fdbk_rating);
  info = "Please rate the search functionality between 1 and 10";
  icon = create_icon("far fa-question-circle", info, {'margin-left':'3px'});
  div4 = create_div("","fdbk_form_row",null,[div,inp,icon]);

  lab = create_lab("Favorite:","","",null);
  div = create_div("","",{'display':'inline-block', 'width':'60px'},[lab]);
  sel = create_sel_favorite("sel_fdbk_favorite","fdbk_text_input",{'width':'220px'});
  info = "Please let us know your favorite search function";
  icon = create_icon("far fa-question-circle", info, {'margin-left':'3px'});
  div5 = create_div("","fdbk_form_row",null,[div,sel,icon]);
  
  lab = create_lab("Text:","","",null);
  div = create_div("","",{'display':'inline-block', 'width':'60px','vertical-align':'top'},[lab]);
  inp = create_inp_textarea("inp_fdbk_text", "fdbk_text_input arrow", 2048, "Feedback Text", null);
  info = "The maximum number of characters is 2048";
  icon = create_icon("far fa-question-circle", info, {'margin-left':'3px', 'vertical-align':'top'});
  div6 = create_div("","fdbk_form_row",null,[div,inp,icon]);
  
  div_form = create_div("","",null,[div1,div2,div3,div4,div5,div6]);
  return div_form;
}

async function insert_fdbk(params) {
  var url, result = false;
  url = "/w/extensions/VaniSearch/src/vs_util.php?func=insert_fdbk";
  var formData = new FormData();
  formData.append('params', JSON.stringify(params));
  await fetch(url, {method: 'POST', body: formData})
    .then((resp) => resp.json())
    .then((data) => {
      if (data.message) div_fdbk_mesg.textContent = data.message;
      else result = true;
    })
    .catch(function(error) {
    });
  return result;
}

async function select_fdbk(event, fdbk_id) {
  var text;
  g_fdbk_data[g_fdbk_id].row.classList.remove("selrow");
  g_fdbk_id = fdbk_id;
  g_fdbk_data[fdbk_id].row.classList.add("selrow");
  text = await get_fdbk_text(fdbk_id);
  div_fdbk_text.innerHTML = text;
}

function keydn_fdbk(event) {
  if (g_fdbk_id == 0) return;
  var obj = event.target;
  if (obj.classList.contains("arrow")) return;
  var kc = event.keyCode;
  if (kc >= 35 && kc <= 40) {
    event.preventDefault()
    var row = g_fdbk_data[g_fdbk_id].row;
    if (kc == 35) row = row.parentNode.lastElementChild;
    else if (kc == 36) row = row.parentNode.firstElementChild;
    else if (kc == 37 || kc == 38) row = row.previousElementSibling;
    else if (kc == 39 || kc == 40) row = row.nextElementSibling;
    if (row != null) {
      row.click();
      row.scrollIntoView({block: "center", behavior: "smooth"});
    }
  }
}

function create_tbl(id, cls, width) {
  var tbl;
  tbl = document.createElement("table");
  tbl.id = id;
  tbl.classList = cls;
  tbl.style.width = width;
  return tbl;
}

function create_head(cells) {
  var head, row;
  head = document.createElement("thead");
  row = create_row(cells);
  head.appendChild(row);
  return head;
}
function create_body() {
  var body;
  body = document.createElement("tbody");
  return body;
}

function create_row(cells) {
  var row;
  row = document.createElement("tr");
  cells.forEach(cel => {row.appendChild(cel)});
  return row;
}

function create_cel(tag, cls, content,width) {
  var cel;
  cel = document.createElement(tag);
  if (cls) cel.classList = cls;
  cel.style.width = width;
  cel.textContent = content;
  return cel;
}

function create_inp_textarea(id, cls, maxlength, placeholder, rules) {
  var inp;
  inp = document.createElement("textarea");
  inp.id = id;
  inp.maxlength = maxlength;
  inp.placeholder = placeholder;
  if (cls) inp.classList = cls;
  if (rules) Object.assign(inp.style, rules);
  return inp;
}

function provide_feedback() {
  div_fdbk_display.style.display = "none";
  div_fdbk_form.style.display = "block";
}

async function submit_feedback() {
  var params, name, cntr_id, email, rating, favorite, text;
  name = inp_fdbk_name.value.trim();
  cntr_id = parseInt(sel_fdbk_cntr.value);
  email = inp_fdbk_email.value.trim();
  rating = parseInt(spin_fdbk_rating.value);
  favorite = sel_fdbk_favorite.value;
  text = inp_fdbk_text.value.trim();
  if (!validate_feedback(name, email, text)) return;
  params = {'name':name, 'cntr_id':cntr_id, 'email':email, 'rating':rating, 'favorite':favorite, 'text':text};
  if (!await insert_fdbk(params)) return;
  //div_fdbk_form.style.display = "none";
  //div_fdbk_display.style.display = "block";
  
  /* reload */
  toggle_fdbk();
  div_fdbk_contain.parentNode.removeChild(div_fdbk_contain);
  g_fdbk_loaded = false;
  feedback();
}

function cancel_feedback() {
  div_fdbk_mesg.textContent = "";
  div_fdbk_form.style.display = "none";
  div_fdbk_display.style.display = "block";
}

function validate_feedback(name, email, text) {
  if (!name) { div_fdbk_mesg.textContent = "You have to enter a name"; return false }
  if (email && !valid_email(email)) { div_fdbk_mesg.textContent = "This email address is not valid"; return false }
  if (text.length < 5) { div_fdbk_mesg.textContent = "You have to enter at least 5 characters in the feedback text"; return false }
  div_fdbk_mesg.textContent = "";
  return true;
}

function toggle_fdbk() {
  div_fdbk_wrapper.classList.toggle("hidden");
  if (div_fdbk_wrapper.classList.contains("hidden")) { document.onkeydown = null; cancel_feedback(); }
  else document.onkeydown = () => keydn_fdbk(event);
}

function change_fdbk_rating() {
  if (spin_fdbk_rating.value < 0) spin_fdbk_rating.value = 0;
  else if (spin_fdbk_rating.value > 10) spin_fdbk_rating.value = 10;
}

function create_sel_cntr(id,cls,rules) {
  var countries, sel, opt;

  sel = document.createElement("select");
  sel.id = id;
  if (cls) sel.classList = cls;
  if (rules) Object.assign(sel.style, rules);

  opt = create_opt("-","0","",false);
  sel.appendChild(opt);
  
  countries = Object.keys(g_countries);
  countries.sort(function(a, b){if (g_countries[a].name > g_countries[b].name) return 1; if (g_countries[a].name < g_countries[b].name) return -1; return 0});
  countries.forEach(cntr_id => {
    let country = g_countries[cntr_id];
    opt = create_opt(country.name,cntr_id,"",false);
    sel.appendChild(opt);
  });
  return sel;
}

function create_sel_favorite(id,cls,rules) {
  var searches, sel, opt;

  sel = document.createElement("select");
  sel.id = id;
  if (cls) sel.classList = cls;
  if (rules) Object.assign(sel.style, rules);

  opt = create_opt("None","none","",false);
  sel.appendChild(opt);
  
  searches = Object.keys(g_tabs["main"].sheets);
  searches.forEach(type => {
    let search = g_tabs["main"].sheets[type];
    opt = create_opt(search.caption,type,"",false);
    sel.appendChild(opt);
  });
  return sel;
}

function valid_email(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}