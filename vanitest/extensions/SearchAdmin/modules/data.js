var g_live_server = true;
var g_vanis = [];
var g_vanitypes = [];
var g_petals = [];
var g_languages = [];
var g_categories = [];
var g_filt_pages = [];
var g_dict_pages = [];

var g_sync = true;
var g_reset = true;
var g_focus = {"vani": "", "catg": ""}; /* always master */
var g_sel_row = null;

var g_tot_records = 0;
var g_tot_pages = 0;
var g_cur_page = 1;

var g_diff = 0;

var g_nav_data = {
  "filter": {"tot_records": 0, "tot_pages": 0, "cur_page": 0},
  "catg": {"tot_records": 0, "tot_pages": 0, "cur_page": 0},
  "page": {"tot_records": 0, "tot_pages": 0, "cur_page": 0},
  "text": {"tot_records": 0, "tot_pages": 0, "cur_page": 0},
  "dict": {"tot_records": 0, "tot_pages": 0, "cur_page": 0}
};

var g_words = {
  "catg": [],
  "page": [],
  "text": []
};

var g_tbody = {"master": null, "detail": null};
var g_range = {"vani": [], "catg": []}; /* always master */

var g_tabs = {
  "main": {
    "elem": null, "current": "", "parent": "",
    "sheets": {
      "filter": {"caption": "Filter", "button": null, "content": null, "loaded": true, "func": () => get_filt_pages(false)},  
      "match": {"caption": "Word Match", "button": null, "content": null, "loaded": true},
      "dict": {"caption": "Dictionary", "button": null, "content": null, "loaded": false, "func": (count = true, diff = false) => get_dict_pages(count,diff)}
    }
  },
  "match": {
    "elem": null, "current": "", "parent": "main",
    "sheets": {
      "catg": {"caption": "Categories", "button": null, "content": null, "loaded": false, "func": (count = true) => get_catg_words(count)},
      "page": {"caption": "Pages", "button": null, "content": null, "loaded": false, "func": (count = true) => get_page_words(count)},
      "text": {"caption": "Text", "button": null, "content": null, "loaded": false, "func": (count = true) => get_text_words(count)}
    }
  }
};

var g_sort_options = 
  {"master":
    {"vani": [
      {"type": "id", "sort": 0, "elem": null},
      {"type": "code", "sort": 0, "elem": null},
      {"type": "name", "sort": 0, "elem": null},
      {"type": "tot_pages", "sort": 0, "elem": null}
     ],
     "catg": [
      {"type": "id", "sort": 0, "elem": null},
      {"type": "name", "sort": 0, "elem": null},
      {"type": "type", "sort": 0, "elem": null}
     ]},
   "detail":
    {"vani": [
      {"type": "id", "sort": 0, "elem": null},
      {"type": "name", "sort": 0, "elem": null}
     ],
     "catg": [
      {"type": "id", "sort": 0, "elem": null},
      {"type": "name", "sort": 0, "elem": null},
      {"type": "total", "sort": 0, "elem": null},
      {"type": "tot_config", "sort": 0, "elem": null},
      {"type": "value", "sort": 0, "elem": null} 
     ]},
   "match":
    {"catg_words": [
      {"type": "tokn", "sort": 0, "elem": null},
      {"type": "lang", "sort": 0, "elem": null},
      {"type": "petl", "sort": 0, "elem": null},
      {"type": "freq", "sort": 0, "elem": null}
     ],
     "page_words": [
      {"type": "tokn", "sort": 0, "elem": null},
      {"type": "lang", "sort": 0, "elem": null},
      {"type": "petl", "sort": 0, "elem": null},
      {"type": "freq", "sort": 0, "elem": null}
     ],
     "text_words": [
      {"type": "tokn", "sort": 0, "elem": null},
      {"type": "lang", "sort": 0, "elem": null},
      {"type": "petl", "sort": 0, "elem": null},
      {"type": "freq", "sort": 0, "elem": null}
     ]},
   "dict":
    {"pages": [
      {"type": "id", "sort": 0, "elem": null},
      {"type": "title", "sort": 0, "elem": null},
      {"type": "stat", "sort": 0, "elem": null},
      {"type": "rev_time", "sort": 0, "elem": null},
      {"type": "pge_time", "sort": 0, "elem": null}
     ]}
  };
  
var g_sort_index = 
  {"master": {"vani": 2, "catg": 1},
   "detail": {"vani": 1, "catg": 1},
   "match": {"catg_words": 0, "page_words": 0, "text_words": 0},
   "dict": {"pages": 1}
  };

var g_buttons_filter = 
  {"but_delete":
    {"caption": "Delete",
     "balloon": "Delete the selected vanis",
     "func": () => del_vanis(),
     "views": ["vani"]},
   "but_link":
    {"caption": "Link",
     "balloon": "Link the selected vanis to Vanisource pages",
     "func": () => lnk_vanis(),
     "views": ["vani"]},
   "but_vani":
    {"caption": "Vani",
     "balloon": "Create a vani for each selected category page",
     "func": () => ins_vanis(),
     "views": ["catg"]},
   "but_clear":
    {"caption": "Clear",
     "balloon": "Clear selection",
     "func": () => clear_range(),
     "views": ["vani","catg"]},
   "but_all":
    {"caption": "All",
     "balloon": "Select all records",
     "func": () => select_all(),
     "views": ["vani","catg"]},
   "but_refresh": 
    {"caption": "Refresh",
     "balloon": "Refresh data",
     "func": () => get_master(),
     "views": ["vani","catg"]},
   "but_help":
    {"caption": "Help",
     "balloon": "Show help information",
     "func": () => show_help(),
     "views": ["vani"]}
  };

var g_buttons_match = 
  {"but_gen_catg":
    {"caption": "Generate",
     "balloon": "Generate category match words",
     "func": () => gen_match_words('catg'),
     "views": ["catg_words"]},
   "but_gen_page":
    {"caption": "Generate",
     "balloon": "Generate page match words",
     "func": () => gen_match_words('page'),
     "views": ["page_words"]},
   "but_gen_text":
    {"caption": "Generate",
     "balloon": "Generate text match words",
     "func": () => gen_text_words(),
     "views": ["text_words"]},
   "but_help_catg":
    {"caption": "Help",
     "balloon": "Show help information",
     "func": () => show_help(),
     "views": ["catg_words"]},
   "but_help_page":
    {"caption": "Help",
     "balloon": "Show help information",
     "func": () => show_help(),
     "views": ["page_words"]},
   "but_help_text":
    {"caption": "Help",
     "balloon": "Show help information",
     "func": () => show_help(),
     "views": ["text_words"]},
   "but_stat_dict":
    {"caption": "Status",
     "balloon": "Set status of records with different timestamps to 0",
     "func": () => set_diff_status(),
     "views": ["dict_pages"]},
   "but_diff_dict":
    {"caption": "Diff",
     "balloon": "Filter records with different timestamps",
     "func": () => get_dict_pages(true,true),
     "views": ["dict_pages"]},
   "but_refresh_dict":
    {"caption": "Refresh",
     "balloon": "Refresh data",
     "func": () => get_dict_pages(true),
     "views": ["dict_pages"]},
   "but_help_dict":
    {"caption": "Help",
     "balloon": "Show help information",
     "func": () => show_help(),
     "views": ["dict_pages"]}
  };
