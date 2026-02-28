var g_live_server = true;
var g_div_main = null;
var g_books = {};
var g_parts = {};
var g_chaps = {};
var g_languages = {};
var g_hierarchy = null;

var g_tabs = {
  "main": {
    "elem": null, "current": "",
    "sheets": {
      "catg": {"caption": "Categories", "button": null, "content": null},
      "page": {"caption": "Pages", "button": null, "content": null},
      "text": {"caption": "Text", "button": null, "content": null},
      "syno": {"caption": "Synonyms", "button": null, "content": null},
      "line": {"caption": "Verse Lines", "button": null, "content": null},
      "trns": {"caption": "Verse Translations", "button": null, "content": null}
    }
  },
  "text": {
    "elem": null, "current": "",
    "sheets": {
      "sear": {"caption": "Search", "button": null, "content": null},
      "filt": {"caption": "Filter", "button": null, "content": null}
    }
  }
};

var g_options_sea = {
  "contains": {
    "caption": "Contains", "tooltip": "Contains the search text as it is", "exclude": []
  },
  "contains_all": {
    "caption": "Contains all words", "tooltip": "Contains all separate words of the search text in any order", "exclude": []
  },
  "contains_any": {
    "caption": "Contains any word", "tooltip": "Contains at least one word of the search text", "exclude": ["sel_op_text"]
  },
  "equals": {
    "caption": "Is equal to", "tooltip": "Is equal to the search text", "exclude": ["sel_op_text"]
  },
  "starts": {
    "caption": "Starts with", "tooltip": "Starts with the search text", "exclude": ["sel_op_text"]
  },
  "starts_any": {
    "caption": "Starts with any word", "tooltip": "Starts with at least one word of the search text", "exclude": ["sel_op_text"]
  },
  "ends": {
    "caption": "Ends with", "tooltip": "Ends with the search text", "exclude": ["sel_op_text"]
  },
  "ends_any": {
    "caption": "Ends with any word", "tooltip": "Ends with at least one word of the search text", "exclude": ["sel_op_text"]
  }
}

var g_options_rpp = {
  "25": {"caption": "25", "tooltip": ""},
  "50": {"caption": "50", "tooltip": ""},
  "100": {"caption": "100", "tooltip": ""},
  "250": {"caption": "250", "tooltip": ""},
  "500": {"caption": "500", "tooltip": ""}
}

var g_options_match = {
  "contains": {"caption": "Contains", "tooltip": ""},
  "starts": {"caption": "Starts with", "tooltip": ""},
  "ends": {"caption": "Ends with", "tooltip": ""}
}

async function init_main(sheetname, search1, search2, ds) {
  var rules_head = {'height': '5%'};
  var rules_side = {'height': '90%', 'width': '5%'};
  var rules_anal = {'display': 'inline-block', 'vertical-align': 'top', 'margin-left': '5px', 'max-width': '400px', 'word-wrap': 'break-word'};
  var div_head, div_left, div_right, div_foot, div_tab, div_link_bar, div_help_wrapper, div_fdbk_wrapper, div_word_match;
  var div_content = document.getElementById("mw-content-text");

  div_word_match = create_div("div_word_match","word_match hidden",null,[]);
  div_link_bar = create_link_bar();
  div_help_wrapper = create_help_wrapper();
  div_fdbk_wrapper = create_fdbk_wrapper();
  div_tab = create_tab("main","",null,["text"]);
  div_head = create_div("div_head","div_head",rules_head,[]);
  div_left = create_div("div_left","div_side",rules_side,[]);
  div_right = create_div("div_right","div_side",rules_side,[]);
  div_foot = create_div("div_foot","div_head",rules_head,[]);
  g_div_main = create_div("div_main","div_main",null,[div_link_bar,div_tab]);
  
  await get_books();
  await get_languages();
  gen_titl_sheet("main","catg","Category Name",(sheetname == "catg" ? search1 : ""));
  gen_titl_sheet("main","page","Page Title",(sheetname == "page" ? search1 : ""));
  gen_text_sheet((sheetname == "text" ? search1 : "")); 

  gen_syno_sheet(search1, search2, ds);
  gen_line_sheet((sheetname == "line" ? search1 : ""));
  gen_trns_sheet((sheetname == "trns" ? search1 : ""));
  div_content.appendChild(g_div_main);
  div_content.appendChild(div_word_match);
  document.body.appendChild(div_help_wrapper);
  document.body.appendChild(div_fdbk_wrapper);
  if (!g_live_server) {
    var div_analysis = create_div("div_analysis","",rules_anal,[]);
    g_div_main.appendChild(div_analysis);
  }
  await init_vanifilt();
  tab_select("main", sheetname, true);
  /* TODO sel_op_text.disabled = true; TODO */
}

async function help_search() {
  var current;

  current = g_tabs["main"].current;
  vs_help_title.textContent = g_search_data[current].name + " Search";  ;
  div_help_text.innerHTML = await get_help_text("help_" + current + ".htm");
  toggle_help();
}

function create_help_wrapper() {
  var div_wrapper, div_content, div_close, div_text, h1, h2;

  div_close = create_div("div_help_close","modal_close",null,[]);
  div_close.onclick = toggle_help;
  div_close.textContent = "X";
  h2 = create_element("","h2","Help","",{'margin':'12px 0px 12px 0px','font-weight':'normal'});
  h1 = create_element("vs_help_title","h1","Search","",{'color': '#666699', 'font-weight':'normal', 'text-align':'center'});
  div_text = create_div("div_help_text","help_text",null,[]);
  div_content = create_div("div_help_content","modal_content",{'max-width': '790px'},[div_close,h2,h1,div_text]);
  div_wrapper = create_div("div_help_wrapper","modal_wrapper hidden",null,[div_content]);
  return div_wrapper;
}

function create_fdbk_wrapper() {
  var div_wrapper, div_content, div_close, div_text, h1, h2;

  div_close = create_div("div_fdbk_close","modal_close",null,[]);
  div_close.onclick = toggle_fdbk;
  div_close.textContent = "X";
  h2 = create_element("","h2","User Feedback","",{'margin':'12px 0px 12px 0px','font-weight':'normal'});
  div_content = create_div("div_fdbk_content","modal_content",{'width': '785px'},[div_close,h2]);
  div_wrapper = create_div("div_fdbk_wrapper","modal_wrapper hidden",null,[div_content]);
  return div_wrapper;
}

function create_link_bar() {
  var div, lnk1, lnk2;
  lnk1 = create_lnk("lnk_help_search","javascript:help_search()","","Help");
  lnk2 = create_lnk("lnk_feedback","javascript:feedback()","","User Feedback");
  div = create_div("div_link_bar","link_bar",null,[lnk1,lnk2]);
  return div;
}

async function get_languages() {
  var url;

  url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_languages";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_languages = data;
    })
    .catch(function(error) {
    });
}

async function get_books() {
  var url;

  url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_books";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_books = data;
    })
    .catch(function(error) {
    });
}

async function get_books() {
  var url;

  url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_books";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_books = data;
    })
    .catch(function(error) {
    });
}

async function get_parts() {
  var url;

  url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_parts";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_parts = data;
    })
    .catch(function(error) {
    });
}

async function get_chaps() {
  var url;

  url = "/w/extensions/VaniSearch/src/vs_util.php?func=get_chaps";
  await fetch(url)
    .then((resp) => resp.json())
    .then((data) => {
      g_chaps = data;
    })
    .catch(function(error) {
    });
}

async function get_help_text(file) {
  var url, result = "";

  url = "/w/extensions/VaniSearch/docu/" + file;
  await fetch(url)
    .then((resp) => resp.text())
    .then((text) => {
      result = text;
    })
    .catch(function(error) {
    });
  return result;
}
