class HtmlElem {
  constructor (tag, elem) {
    this.obj = document.createElement(tag);
    if (elem.id) this.obj.id = elem.id;
    if (elem.cls) this.obj.classList = elem.cls;
    if (elem.style) Object.assign(this.obj.style, elem.style);
    if (elem.value) this.obj.value = elem.value;
    if (elem.text) this.obj.textContent = elem.text;
    if (elem.onclick) this.obj.onclick = elem.onclick; 
    if (elem.disabled) this.obj.disabled = true;
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
    if (elem.min) this.obj.min = elem.min;
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
     {className:"HtmlButton", id:"btn_pages", cls:"tab_button", text:"Single Quote Pages"}
   ]},
  {className:"HtmlDiv", id:"div_pages", cls:"tab_content border", children:[
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", cls:"headerblock", children:[
            {className:"HtmlLabel", cls:"headerunit", text:"Petal:"},
            {className:"HtmlLabel", cls:"headerunit", text:"Filter:"},
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlSelect", id:"sel_petl", cls:"headerunit", disabled:1, onchange:()=>ctgLogic.getPages(true), populate:(obj)=>appLogic.getPetals(obj)},
           {className:"HtmlInput", id:"inp_filt_catg", type:"Text", cls:"headerunit", style:{margin:0}, onchange:()=>ctgLogic.getPages(true)}
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
            {className:"HtmlLabel", cls:"headerunit", text:"Records Per Page:"},
            {className:"HtmlLabel", cls:"headerunit", text:"Match Type:"},
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlSelect", id:"sel_rpp", cls:"headerunit", onchange:()=>ctgLogic.getPages(true), populate:(obj)=>appLogic.getRPP(obj)},
           {className:"HtmlSelect", id:"sel_mtyp", cls:"headerunit", onchange:()=>ctgLogic.getPages(true), populate:(obj)=>appLogic.getMatchTypes(obj)},
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlDiv", cls:"headerunit", children:[
              {className:"HtmlLabel", text:"Include:", style:{"margin-right":"10px"}},
              {className:"HtmlSelect", id:"sel_include", onchange:()=>ctgLogic.getPages(true), populate:(obj)=>appLogic.getIncludeValues(obj)},
           ]},
           {className:"HtmlDiv", cls:"headerunit", children:[
              {className:"HtmlButton", cls:"cmdbutton", text:"Include", tooltip:"Include Current Selection", onclick:()=>ctgLogic.includeSelection()},
              {className:"HtmlButton", cls:"cmdbutton", text:"Exclude", tooltip:"Exclude Current Selection", onclick:()=>ctgLogic.excludeSelection()},
           ]},
         ]},
      ]},
     {className:"HtmlDiv", cls:"navunit", text:"Total Records:"},
     {className:"HtmlDiv", id:"div_tot_records", cls:"navunit", text:"0"},
     {className:"HtmlDiv", cls:"navunit", text:"Page:", style:{"margin-left":"5px"}},
     {className:"HtmlDiv", id:"div_cur_page", cls:"navunit", text:"0"},
     {className:"HtmlDiv", cls:"navunit", text:"/"},
     {className:"HtmlDiv", id:"div_tot_pages", cls:"navunit", text:"0"},
     {className:"HtmlDiv", style:{display:"inline-block", "margin-left":"5px"}, children:[
        {className:"HtmlButton", cls:"navbutton fas fa-angle-left", tooltip:"Previous Page", onclick:()=>ctgLogic.prevPage()},
        {className:"HtmlButton", cls:"navbutton fas fa-angle-right", tooltip:"Next Page", onclick:()=>ctgLogic.nextPage()},
        {className:"HtmlButton", cls:"navbutton fas fa-angle-double-left", tooltip:"First Page", onclick:()=>ctgLogic.firstPage()},
        {className:"HtmlButton", cls:"navbutton fas fa-angle-double-right", tooltip:"Last Page", onclick:()=>ctgLogic.lastPage()}
      ]},
     {className:"HtmlDiv", id:"div_tbl_pages"}
   ]}
];
