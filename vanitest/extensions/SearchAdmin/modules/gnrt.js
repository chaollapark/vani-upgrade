async function gen_match_words(type) {
  var sel_petl, sel_lang, petl_id, lang_id, div, petal, question;
  var data = {
    "catg": {"nspace":14, "name":"category"},
    "page": {"nspace":0, "name":"page"}
  };
  
  sel_petl = document.getElementById("sel_petl_" + type);
  petl_id = sel_petl.value;
  petal = sel_petl.options[sel_petl.selectedIndex].text;
  question = "Are you sure that you want to generate " + data[type].name + " match words for " +
    (petl_id == 0 ? "all petals?" : "the " + petal + " petal?");
  if (!confirm(question)) return;
  
  div = document.getElementById("div_" + type + "_table");
  div.innerHTML = "";
  
  sel_lang = document.getElementById("sel_lang_" + type);
  lang_id = sel_lang.value;

  // for each petal
  var page_count, ceil = 0, ofs = 0, lim = 5000, span, but;
  var options = Array.from(sel_petl.options);
  for (var i = 1; i < options.length; i++) {
    petl_id = options[i].value;
    if ((sel_petl.value != 0) && (sel_petl.value != petl_id)) continue;
    petal = options[i].text.toLowerCase();
    div.innerHTML += "Generating " + data[type].name + " match words for the " + petal + " petal:<br>";
    page_count = await get_match_page_count(petal, lang_id, data[type].nspace);
    //span = create_span("","Page count = " + page_count,"span_gen_match");
    //div.appendChild(span);
    div.innerHTML += "Page count = " + page_count + "<br>";
    ceil = Math.ceil(page_count / lim); 
    for (var j = 0; j < ceil; j++) {
      ofs = j * lim;
      //span = create_span("","- processing page " + (j * lim + 1) + " - " + Math.min(page_count,j * lim + lim) + " ...","span_gen_match");
      //div.appendChild(span);
      div.innerHTML += "- processing page " + (ofs + 1) + " - " + Math.min(page_count, ofs + lim) + " ...<br>";
      div.scrollTop = div.scrollHeight;
      await gen_match_range(petal, petl_id, lang_id, data[type].nspace, ofs, lim);
    }
  }
  but = cre_button("","Ok","","none", g_tabs["match"].sheets[type].func);
  div.appendChild(but);
  div.scrollTop = div.scrollHeight;
}

async function get_match_page_count(petal, lang_id, nspace) {
  var url, result = 0;
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=match_page_count&petal=" + petal + "&lang_id=" + lang_id + "&nspace=" + nspace;
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      result = data; 
    })
    .catch(function(error) {
    });
  return result;
}

async function gen_match_range(petal, petl_id, lang_id, nspace, ofs, lim) {
  var url, result = 0;
  url = 
    "/w/extensions/SearchAdmin/src/util.php?func=gen_match_range&petal=" + petal + 
    "&petl_id=" + petl_id + "&lang_id=" + lang_id + "&nspace=" + nspace + "&ofs=" + ofs + "&lim=" + lim;
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      result = data; 
    })
    .catch(function(error) {
    });
  return result;
}
