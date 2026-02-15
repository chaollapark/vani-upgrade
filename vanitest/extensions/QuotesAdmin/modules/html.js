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
    if (elem.name) this.obj.name = elem.name;
    if (elem.readonly) this.obj.readOnly = true;
    if (elem.checked) this.obj.checked = true;
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
  {className:"HtmlDiv", cls:"border", children: [
     {className:"HtmlButton", id:"btn_categories", cls:"tab_button", text:"Vanisource Categories", tooltip:"View and Manage Vanisource Categories", onclick:()=>appLogic.selectTab("categories")},
     {className:"HtmlButton", id:"btn_vqsections", cls:"tab_button", text:"Vaniquote Sections", tooltip:"View and Manage Vaniquote Sections", onclick:()=>appLogic.selectTab("vqsections")},
     {className:"HtmlButton", id:"btn_vqhistory", cls:"tab_button", text:"Vaniquote Count History", tooltip:"View Vaniquote Count History", onclick:()=>appLogic.selectTab("vqhistory")}
   ]},
  {className:"HtmlDiv", id:"div_categories", cls:"tab_content border", children:[
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", cls:"headerblock", children:[
            {className:"HtmlLabel", cls:"headerunit", text:"Type:"},
            {className:"HtmlLabel", cls:"headerunit", text:"Filter:"},
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlSelect", id:"sel_vtyp", cls:"headerunit", onchange:()=>sttLogic.getVanis(), populate:(obj)=>appLogic.getVaniTypes(obj)},
           {className:"HtmlInput", id:"inp_filt_stat", type:"Text", cls:"headerunit", style:{margin:0}, onchange:()=>sttLogic.getVanis()}
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlButton", cls:"cmdbutton", text:"Select All", onclick:()=>sttLogic.dataTable.checkAll(true)},
           {className:"HtmlButton", cls:"cmdbutton", text:"Unselect All", onclick:()=>sttLogic.dataTable.checkAll(false)},
           {className:"HtmlButton", cls:"cmdbutton", text:"Count Links", onclick:()=>sttLogic.countLinks()},
           {className:"HtmlDiv", id:"div_cat_related", text:"Related pages: 0", style:{"margin-top":"2px"}}
         ]}
      ]},
     {className:"HtmlDiv", id:"div_tbl_vanis"}
   ]}, 
  {className:"HtmlDiv", id:"div_vqsections", cls:"tab_content border", children:[ 
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlButton", cls:"cmdbutton", text:"Select All", onclick:()=>vqsLogic.dataTable.checkAll(true)},
           {className:"HtmlButton", cls:"cmdbutton", text:"Unselect All", onclick:()=>vqsLogic.dataTable.checkAll(false)},
           {className:"HtmlButton", cls:"cmdbutton", text:"Count Quotes", onclick:()=>vqsLogic.countQuotes()},
           {className:"HtmlDiv", id:"div_vqs_related", text:"Related pages: 0", style:{"margin-top":"2px"}}
         ]}
      ]},
     {className:"HtmlDiv", id:"div_tbl_vqsections"}
   ]},
  {className:"HtmlDiv", id:"div_vqhistory", cls:"tab_content border", children:[ 
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlButton", cls:"cmdbutton", style:{"margin-bottom":"5px"}, text:"Refresh", onclick:()=>vqhLogic.getVqHistory()}
         ]}
      ]},
     {className:"HtmlDiv", id:"div_tbl_vqhistory"}
   ]}
];
