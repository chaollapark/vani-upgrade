var appLogic, tblLogic;

mw.hook('wikipage.content').add( function () {
  const config = mw.config.get( 'cpstatConfig' );
  initPage('div_main', config);
});

async function initPage(parentId,config) {
  appLogic = new AppLogic();
  tblLogic = new TblLogic();
  await appLogic.renderHtml(document.getElementById(parentId),htmlElems);
  tblLogic.parentElem = div_table;
  if (!config) appLogic.setDates();
  else {
    appLogic.setParams(config);
    tblLogic.getStatistics();
  }
}

class AppLogic {
  constructor () {
    //this.removeLeftMargin();
  }

  async renderHtml(parent,elems) {
    await Promise.all(elems.map(async (elem) => {
      let instance = new htmlClasses[elem.className](elem);
      parent.appendChild(instance.obj);
      if ("populate" in elem) await elem.populate(instance.obj);
      if ("children" in elem) await this.renderHtml(instance.obj,elem.children);
    }));
  }

  listPetals(parent) {
    let instance;
    instance = new HtmlOption({value:"0", text:"All", selected:true});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"vanipedia", text:"Vanipedia"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"vanisource", text:"Vanisource"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"vaniquotes", text:"Vaniquotes"});
    parent.appendChild(instance.obj);
  }
  
  listNspaces(parent) {
    let instance;
    instance = new HtmlOption({value:"0", text:"Both", selected:true});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"C", text:"Category"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"P", text:"Page"});
    parent.appendChild(instance.obj);
  }
  
  listAttributes(parent,sel) {
    let instance;
    instance = new HtmlOption({value:"P", text:"Petal", selected:sel=="P"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"N", text:"Namespace", selected:sel=="N"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"T", text:"Time Unit", selected:sel=="T"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"Q", text:"Total", selected:sel=="Q"});
    parent.appendChild(instance.obj);
  }
 
  configToUrl() {
    let config = 
      `?config=${sel_petal.value},${sel_nspace.value},${sel_horiz.value},${sel_vertic.value},` +
      `${date_from.value},${date_until.value},${tblLogic.dimspec.unit}`;
    history.pushState(null,"",window.location.pathname + config);
  }
  
  setParams(config) {
    let params = config.split(",");
    sel_petal.value = params[0];
    sel_nspace.value = params[1];
    sel_horiz.value = params[2];
    sel_vertic.value = params[3];
    date_from.value = params[4];
    date_until.value = params[5];
    document.querySelector(`input[name="time_unit"][value="${params[6]}"]`).checked = true;
  }

  setDates() {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;
    date_from.value = `${year}-01-01`;
    date_until.value = `${year}-${month}-${day}`;
  }

  csvToClipBoard() {
    if (!tblLogic.dataMatrix.length) { alert("Please generate statistics first"); return }
    let str = tblLogic.genCsv();
    let el = document.createElement('textarea');
    el.value = str;
    el.readOnly = true;
    el.style = {position: "absolute", left: "-9999px"};
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    alert("CSV copied to clipboard");
  }
  
  removeLeftMargin() {
    let elem = document.getElementById("content").parentNode.parentNode;
    elem.classList.remove("row");
  }
}
