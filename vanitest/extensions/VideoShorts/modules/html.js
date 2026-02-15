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
    if (elem.maxlength) this.obj.maxLength = elem.maxlength;
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

class HtmlIframe extends HtmlElem {
  constructor (elem) {
    super("iframe", elem);
    if (elem.src) this.obj.src = elem.src;
    if (elem.height) this.obj.height = elem.height;
    if (elem.width) this.obj.width = elem.width;
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
  HtmlIframe,
  HtmlH1,
  HtmlTextNode
};

// <iframe src="//www.youtube.com/embed/9KuByBTAFSE?" width="260" height="360" frameborder="0" allowfullscreen="true"></iframe>

const htmlElems = [
  {className:"HtmlDiv", cls:"border", children: [
     {className:"HtmlButton", id:"btn_english", cls:"tab_button", text:"English", tooltip:"View and Maintain English versions", onclick:()=>appLogic.selectTab("english")},
     {className:"HtmlButton", id:"btn_translation", cls:"tab_button", text:"Translation", tooltip:"View and Maintain Translations", onclick:()=>appLogic.selectTab("translation")}
   ]},
  {className:"HtmlDiv", id:"div_english", cls:"tab_content border", children:[
   ]}, 
  {className:"HtmlDiv", id:"div_translation", cls:"tab_content border", children:[ 
   ]}
];
