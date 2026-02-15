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
   {className:"HtmlDiv", children:[
      {className:"HtmlDiv", cls:"paramblock", children:[
          {className:"HtmlLabel", cls:"paramunit", text:"Petal:"},
          {className:"HtmlLabel", cls:"paramunit", text:"Namespace:"},
       ]},
      {className:"HtmlDiv", cls:"paramblock", children:[
         {className:"HtmlSelect", id:"sel_petal", cls:"paramunit", populate:(obj)=> appLogic.listPetals(obj)},
         {className:"HtmlSelect", id:"sel_nspace", cls:"paramunit", populate:(obj)=> appLogic.listNspaces(obj)}
       ]},
      {className:"HtmlDiv", cls:"paramblock", children:[
         {className:"HtmlLabel", cls:"paramunit", text:"Horizontal:"},
         {className:"HtmlLabel", cls:"paramunit", text:"Vertical:"}
       ]},
      {className:"HtmlDiv", cls:"paramblock", children:[
         {className:"HtmlSelect", id:"sel_horiz", cls:"paramunit", populate:(obj)=>appLogic.listAttributes(obj,"P")},
         {className:"HtmlSelect", id:"sel_vertic", cls:"paramunit", populate:(obj)=>appLogic.listAttributes(obj,"T")}
       ]},
      {className:"HtmlDiv", cls:"paramblock", children:[
         {className:"HtmlLabel", cls:"paramunit", text:"From:"},
         {className:"HtmlLabel", cls:"paramunit", text:"Until:"}
       ]},
      {className:"HtmlDiv", cls:"paramblock", children:[
         {className:"HtmlInput", id:"date_from", type:"date", cls:"paramunit"},
         {className:"HtmlInput", id:"date_until", type:"date", cls:"paramunit"}
       ]}
    ]},   
   {className:"HtmlDiv", children:[
      {className:"HtmlLabel", cls:"paramblock", text:"Time Unit:"},
      {className:"HtmlDiv", cls:"paramblock", children:[
         {className:"HtmlInput", id:"rad_year", name:"time_unit", type:"radio", value:"Y"},
         {className:"HtmlLabel", text:"Year", htmlfor:"rad_year"}
       ]},
      {className:"HtmlDiv", cls:"paramblock", children:[
         {className:"HtmlInput", id:"rad_month", name:"time_unit", type:"radio", value:"M", checked:true},
         {className:"HtmlLabel", text:"Month", htmlfor:"rad_month"}
       ]},
      {className:"HtmlDiv", cls:"paramblock", children:[
         {className:"HtmlInput", id:"rad_week", name:"time_unit", type:"radio", value:"W"},
         {className:"HtmlLabel", text:"Week", htmlfor:"rad_week"}
       ]},
    ]},
  {className:"HtmlButton", cls:"mrg_right5", text:"Show Statistics", onclick:()=>tblLogic.getStatistics()},
  {className:"HtmlButton", cls:"mrg_right5", text:"CSV To Clipboard", onclick:()=>appLogic.csvToClipBoard()},
  {className:"HtmlDiv", id:"div_table", style:{width:"max-content"}}
];
