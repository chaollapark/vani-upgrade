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
     {className:"HtmlButton", id:"btn_trpr_master", cls:"tab_button", text:"Translation Text Marks", tooltip:"Manage Translation Text Marks", onclick:()=>appLogic.selectTab("trpr_master")},
     {className:"HtmlButton", id:"btn_tran_master", cls:"tab_button", text:"Translation Properties", tooltip:"Manage Translation Property Links", onclick:()=>appLogic.selectTab("tran_master")}
   ]},
  {className:"HtmlDiv", id:"div_trpr_master", cls:"tab_content border", children:[ 
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", cls:"headerblock", children:[
            {className:"HtmlLabel", cls:"headerunit", text:"Property:"},
            {className:"HtmlLabel", cls:"headerunit", text:"Filter:"},
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlSelect", id:"sel_prop", cls:"headerunit", onchange:()=>trprMaster.getTRPR(), populate:(obj)=>appLogic.getProperties(obj,true)},
           {className:"HtmlInput", id:"inp_filt_trpr", type:"Text", cls:"headerunit", style:{margin:0}, onchange:()=>trprMaster.getTRPR()}
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlButton", cls:"cmdbutton", text:"Refresh", onclick:()=>trprMaster.getTRPR()},
           {className:"HtmlButton", cls:"cmdbutton", text:"Mark Selection", onclick:()=>trprMaster.dataTable.markSelection()}
         ]}
      ]},
     {className:"HtmlDiv", id:"div_tbl_trpr_master"}
   ]},
  {className:"HtmlDiv", id:"div_tran_master", cls:"tab_content border", children:[ 
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", cls:"headerblock", children:[
            {className:"HtmlLabel", cls:"headerunit", text:"Filter:"},
         ]},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlInput", id:"inp_filt_tran", type:"Text", cls:"headerunit", style:{margin:0}, onchange:()=>tranMaster.getTRAN()}
         ]}
      ]},
     {className:"HtmlDiv", id:"div_tbl_tran_master", cls:"horiz_div"},
     {className:"HtmlDiv", cls:"horiz_div", children:[
        {className:"HtmlDiv", cls:"flex_div", children:[
           {className:"HtmlDiv", children:[
              {className:"HtmlDiv", id:"div_tbl_trpr_detail"},
              {className:"HtmlButton", cls:"cmdbutton", text:"Delete Selected Links", onclick:()=>trprMaster.delProperties()}
            ]},
           {className:"HtmlDiv", children:[
              {className:"HtmlSelect", id:"sel_prop_detail", cls:"headerunit", populate:(obj)=>appLogic.getProperties(obj,false)}, 
              {className:"HtmlButton", cls:"cmdbutton", text:"Add Property Link", style:{"margin-top":"7px"}, onclick:()=>trprMaster.addProperty()}
            ]}
         ]}
      ]}
   ]}
];
