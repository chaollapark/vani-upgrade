class HtmlElem {
  constructor (tag, elem) {
    this.obj = document.createElement(tag);
    if (elem.id) this.obj.id = elem.id;
    if (elem.cls) this.obj.classList = elem.cls;
    if (elem.style) Object.assign(this.obj.style, elem.style);
    if (elem.value) this.obj.value = elem.value;
    if (elem.text) this.obj.textContent = elem.text;
    if (elem.onclick) this.obj.onclick = elem.onclick; 
  }
}

class HtmlDiv extends HtmlElem {
  constructor (elem) {
    super("div", elem);
  }
}

class HtmlButton extends HtmlElem {
  constructor (elem) {
    super("button", elem);
    if (elem.tooltip) this.obj.title = elem.tooltip;
  }
}

class HtmlLabel extends HtmlElem {
  constructor (elem) {
    super("label", elem);
    if (elem.htmlfor) this.obj.htmlFor = elem.htmlfor;
  }
}

class HtmlSelect extends HtmlElem {
  constructor (elem) {
    super("select", elem);
    if (elem.onchange) this.obj.onchange = elem.onchange;
  }
}

class HtmlOption extends HtmlElem {
  constructor (elem) {
    super("option", elem);
    if (elem.selected) this.obj.selected = true;
  }
}

class HtmlA extends HtmlElem {
  constructor (elem) {
    super("a", elem);
    this.obj.href = elem.href;
    if (elem.target) this.obj.target = elem.target;
  }
}

class HtmlTextArea extends HtmlElem {
  constructor (elem) {
    super("textarea", elem);
    this.obj.rows = elem.rows;
    this.obj.cols = elem.cols;
    if (elem.readonly) this.obj.readOnly = true;
  }
}

class HtmlSpan extends HtmlElem {
  constructor (elem) {
    super("span", elem);
  }
}

class HtmlInput extends HtmlElem {
  constructor (elem) {
    super("input", elem);
    this.obj.type = elem.type;
    if (elem.value) this.obj.value = elem.value;
    if (elem.size) this.obj.size = elem.size;
    if (elem.readonly) this.obj.readOnly = true;
    if (elem.onchange) this.obj.onchange = elem.onchange;
  }
}

class HtmlTable extends HtmlElem {
  constructor (elem) {
    super("table", elem);
    if (elem.border) this.obj.border = elem.border;
    if (elem.rows) {
      elem.rows.forEach(row => {
        let tr = document.createElement("tr");
        this.obj.appendChild(tr);
        row.forEach(cel => {
          let td = document.createElement("td");
          if (typeof cel === "object") td.appendChild(cel);
          else td.textContent = cel;
          tr.appendChild(td);
        })
      })
    }
  }
}

class HtmlH1 extends HtmlElem {
  constructor (elem) {
    super("h1", elem);
  }
}

class HtmlTextNode {
  constructor (elem) {
    this.obj = document.createTextNode(elem.text);
  }
}

const htmlClasses = {
  HtmlDiv,
  HtmlButton,
  HtmlLabel,
  HtmlSelect,
  HtmlOption,
  HtmlA,
  HtmlTextArea,
  HtmlSpan,
  HtmlInput,
  HtmlTable,
  HtmlH1,
  HtmlTextNode
};

const htmlElems = [
  {className:"HtmlDiv", style:{"margin-bottom":"5px"}, children:[
     {className:"HtmlA", href:"https://vanipedia.org/wiki/Special:NDropStat", text:"ND Statistics"},
     {className:"HtmlTextNode", text:" | "},
     {className:"HtmlA", href:"https://vanipedia.org/wiki/Nectar_Drops_Help_Documentation", text:"Help Documentation"}
   ]},
  {className:"HtmlDiv", cls:"tab", children: [
     {className:"HtmlButton", id:"btn_english", cls:"tab_button", text:"ENGLISH", tooltip:"Select English Nectar Drop", onclick:()=>appLogic.selectTab("english") },
     {className:"HtmlButton", id:"btn_translation", cls:"tab_button", text:"TRANSLATION", tooltip:"Translate Nectar Drop", onclick:()=>appLogic.selectTab("translation")},
     {className:"HtmlButton", id:"btn_preview", cls:"tab_button", text:"PREVIEW", tooltip:"Preview Nectar Drop translation", onclick:()=>appLogic.selectTab("preview")},
     {className:"HtmlButton", id:"btn_setup", cls:"tab_button", text:"SETUP", tooltip:"Manage setup parameters", onclick:()=>appLogic.selectTab("setup")},
     {className:"HtmlButton", id:"btn_login", cls:"tab_button", text:"LOGIN", tooltip:"Login to Vanipedia", onclick:()=>appLogic.selectTab("login")}
   ]},
  {className:"HtmlDiv", id:"div_english", cls:"tab_content", children:[
     {className:"HtmlDiv", style:{display:"inline-block", width:"610px"}, children:[
        {className:"HtmlDiv", children:[
           {className:"HtmlLabel", cls:"mrg_right5", text:"Year"},
           {className:"HtmlSelect", id:"sel_year", cls:"mrg_right5", onchange:()=>ndropLogic.listNDrops(div_ndrop_select), populate:(obj)=>appLogic.listYearLoca(obj,"year")},
           {className:"HtmlLabel", cls:"mrg_right5", text:"Location"},
           {className:"HtmlSelect", id:"sel_loca", cls:"mrg_right5", onchange:()=>ndropLogic.listNDrops(div_ndrop_select), populate:(obj)=>appLogic.listYearLoca(obj,"loca")},
           {className:"HtmlDiv", id:"div_filt_trans", style:{display:"none", float:"right"}, children:[
              {className:"HtmlInput", type:"checkbox", id:"chb_filt_trans", onchange:()=>ndropLogic.listNDrops(div_ndrop_select)},
              {className:"HtmlLabel", id:"lab_filt_trans", text:"not translated into <language>", htmlfor:"chb_filt_trans"}
            ]}
         ]},
         {className:"HtmlDiv", id:"div_total"},
         {className:"HtmlDiv", id:"div_ndrop_select", populate:(obj)=>ndropLogic.listNDrops(obj)}
      ]},
     {className:"HtmlDiv", id:"div_ndrop_orig", style:{display:"inline-block"}} 
   ]}, 
  {className:"HtmlDiv", id:"div_translation", cls:"tab_content", children:[
     {className:"HtmlDiv", style:{overflow:"hidden"}, children:[
        {className:"HtmlDiv", children:[
           {className:"HtmlLabel", cls:"mrg_right5", text:"Language"},
           {className:"HtmlSelect", id:"sel_language", cls:"mrg_right5", onchange:()=>appLogic.syncLanguage(), populate:(obj)=>appLogic.listLanguages(obj)},
           {className:"HtmlDiv", id:"div_trans_warning", cls:"warning"}
         ]},
        {className:"HtmlDiv", cls:"caption", text:"Title:"},
        {className:"HtmlDiv", id:"div_ndrop_title", cls:"trans_block"},
        {className:"HtmlDiv", cls:"caption", text:"Categories:"},
        {className:"HtmlDiv", id:"div_categories", cls:"trans_block"},
        {className:"HtmlDiv", cls:"caption", text:"Text:"},
        {className:"HtmlDiv", cls:"trans_block", style:{display:"flex"}, children:[
           {className:"HtmlDiv", children:[{className:"HtmlTextArea", id:"txt_nectar_orig", rows:"4", cols:"50", readonly:true}]},
           {className:"HtmlDiv", children:[{className:"HtmlTextArea", id:"txt_nectar_trans", cls:"translation", rows:"4", cols:"50"}]}
         ]},
        {className:"HtmlDiv", cls:"caption", text:"Source Reference:"},
        {className:"HtmlDiv", id:"div_reference", cls:"trans_block"},
        {className:"HtmlButton", id:"btn_create_ndrop", style:{"margin-left":"5px"}, text:"Create Nectar Drop", onclick:()=>ndropLogic.createNdrop()},
        {className:"HtmlDiv", id:"div_create_ok", style:{display:"none", margin:"5px"}, children:[
           {className:"HtmlSpan", id:"nd_success", text:"Nectar Drop successfully created or updated: "},
           {className:"HtmlA", id:"href_ndrop", href:"", target:"__new"}
         ]},
      ]},
   ]}, 
  {className:"HtmlDiv", id:"div_preview", cls:"tab_content", children:[ 
     {className:"HtmlDiv", style:{overflow:"hidden"}, children:[
        {className:"HtmlButton", text:"Show Preview", onclick:()=>ndropLogic.showPreview()},
        {className:"HtmlDiv", id:"div_ndrop_tran"}
      ]},
   ]},
  {className:"HtmlDiv", id:"div_setup", cls:"tab_content", children:[
     {className:"HtmlDiv", id:"div_setup_content", style:{display:"none"}, children:[
        {className:"HtmlH1", id:"hdr_trans_lang", text:"Language: ?"},
        {className:"HtmlDiv", id:"div_setup_warning", cls:"warning"},
        {className:"HtmlDiv", cls:"tab", children:[
           {className:"HtmlButton", id:"btn_su_general", cls:"tab_button", text:"General", tooltip:"General words and templates", onclick:()=>setupLogic.selectTab("su_general")},
           {className:"HtmlButton", id:"btn_su_locations", cls:"tab_button", text:"Locations", tooltip:"Location names", onclick:()=>setupLogic.selectTab("su_locations")},
           {className:"HtmlButton", id:"btn_su_years", cls:"tab_button", text:"Years", tooltip:"Year numbers", onclick:()=>setupLogic.selectTab("su_years")}
         ]},
        {className:"HtmlDiv", id:"div_su_general", cls:"tab_content", children:[
           {className:"HtmlDiv", id:"tbl_su_general", cls:"tbl_container"}
         ]},
        {className:"HtmlDiv", id:"div_su_locations", cls:"tab_content", children:[
           {className:"HtmlDiv", id:"tbl_su_locations", cls:"tbl_container"}
         ]},
        {className:"HtmlDiv", id:"div_su_years", cls:"tab_content", children:[
           {className:"HtmlDiv", id:"tbl_su_years", cls:"tbl_container"}
         ]}
      ]}
   ]}, 
  {className:"HtmlDiv", id:"div_login", cls:"tab_content", children:[
     {className:"HtmlDiv", id:"div_uname_pword", children:[
        {className:"HtmlDiv", children:[
           {className:"HtmlLabel", cls:"inline_70", text:" Username "},
           {className:"HtmlInput", id:"inp_username", type:"text", style:{width:"200px"}},
         ]},
        {className:"HtmlDiv", children:[
           {className:"HtmlLabel", cls:"inline_70", text:" Password "},
           {className:"HtmlInput", id:"inp_password", type:"password", style:{width:"200px"}}
         ]},
        {className:"HtmlButton", text:"Log in", onclick:()=>userLogic.login()},
        {className:"HtmlSpan", id:"spn_login_fail", cls:"login_error"}
      ]},
     {className:"HtmlDiv", id:"div_current_user", children:[
        {className:"HtmlSpan", id:"spn_login_status"},
        {className:"HtmlTextNode", text:"("},
        {className:"HtmlA", href:"javascript:userLogic.logout()", text:"Log out"},
        {className:"HtmlTextNode", text:")"}
      ]},
   ]}
];
