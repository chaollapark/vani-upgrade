var appLogic, tblLogic;

mw.hook('wikipage.content').add( function () {
  const config = mw.config.get('ndropstatConfig');
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

  async listUsers(parent) {
    const url = "/w/extensions/NDropStatistics/src/util.php?func=getUsers";
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        let instance = new HtmlOption({value:"0", text:"All", selected:true});
        parent.appendChild(instance.obj);
        let keys = Object.keys(data).sort((a,b)=>{return (data[a]>data[b] ? 1 : -1)});
        keys.forEach(key => {
          instance = new HtmlOption({value:key, text:data[key]});
          parent.appendChild(instance.obj);
        })      
      })
      .catch(error => {});
  }
  
  async listLanguages(parent) {
    const url = "/w/extensions/NDropStatistics/src/util.php?func=getLanguages";
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        let instance = new HtmlOption({value:"0", text:"All", selected:true});
        parent.appendChild(instance.obj);
        let keys = Object.keys(data).sort((a,b)=>{return (data[a]>data[b] ? 1 : -1)});
        keys.forEach(key => {
          instance = new HtmlOption({value:key, text:data[key]});
          parent.appendChild(instance.obj);
        })      
      })
      .catch(error => {});
  }
  
  listDimensions(parent,sel) {
    let instance;
    instance = new HtmlOption({value:"U", text:"User", selected:sel=="U"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"L", text:"Language", selected:sel=="L"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"T", text:"Time Unit", selected:sel=="T"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"Q", text:"Total", selected:sel=="Q"});
    parent.appendChild(instance.obj);
  }
 
  configToUrl() {
    let config = 
      `?config=${sel_user.value},${sel_lang.value},${sel_horiz.value},${sel_vertic.value},` +
      `${tblLogic.dimspec.unit},${date_from.value},${date_until.value}`;
    history.pushState(null,"",window.location.pathname + config);
  }
  
  setParams(config) {
    let params = config.split(",");
    sel_user.value = params[0];
    sel_lang.value = params[1];
    sel_horiz.value = params[2];
    sel_vertic.value = params[3];
    document.querySelector(`input[name="time_unit"][value="${params[4]}"]`).checked = true;
    date_from.value = params[5];
    date_until.value = params[6];
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
