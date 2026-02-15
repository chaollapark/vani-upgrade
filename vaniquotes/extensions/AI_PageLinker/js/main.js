var appLogic,ctgLogic;

const includeValues = ['Y', 'N', '?'];

async function initPage(parentId) {
  appLogic = new AppLogic();
  ctgLogic = new CtgLogic();
  await appLogic.renderHtml(document.getElementById(parentId),htmlElems);
  sel_petl.value = "vaniquotes";
  appLogic.selectTab("pages");
  await ctgLogic.updPageLinks_1();
  await ctgLogic.updPageLinks_2();
  ctgLogic.getPages(true);
}

class AppLogic {
  constructor () {
    this.activeTab = [null,null];
  }

  async renderHtml(parent,elems) {
    await Promise.all(elems.map(async (elem) => {
      let instance = new htmlClasses[elem.className](elem);
      parent.appendChild(instance.obj);
      if ("populate" in elem) await elem.populate(instance.obj);
      if ("children" in elem) await this.renderHtml(instance.obj,elem.children);
    }));
  }
  
  selectTab(name) {
    if (this.activeTab[0]) {
      this.activeTab[0].classList.remove("active"); 
      this.activeTab[1].classList.remove("active"); 
    }
    let btn = document.getElementById(`btn_${name}`);
    let div = document.getElementById(`div_${name}`);
    btn.classList.add("active");
    div.classList.add("active");
    this.activeTab[0] = btn;
    this.activeTab[1] = div;
  }
  
  getPetals(parent) {
    let instance;
    instance = new HtmlOption({value:"vanipedia", text:"Vanipedia"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"vaniquotes", text:"Vaniquotes"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"vanisource", text:"Vanisource"});
    parent.appendChild(instance.obj);
  }
  
  getRPP(parent) {
    let instance;
    instance = new HtmlOption({value:250, text:"250"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:500, text:"500"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:1000, text:"1000"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:2500, text:"2500"});
    parent.appendChild(instance.obj);
  }
  
  getMatchTypes(parent) {
    let instance;
    instance = new HtmlOption({value:"contains", text:"Contains"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"ends", text:"Ends with"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"starts", text:"Starts with"});
    parent.appendChild(instance.obj);
  }

  getIncludeValues(parent) {
    let instance;
    instance = new HtmlOption({value:"all", text:""});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"yes", text:"Y"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"no", text:"N"});
    parent.appendChild(instance.obj);
    instance = new HtmlOption({value:"maybe", text:"?"});
    parent.appendChild(instance.obj);
  }
  
}

class DataTable {
  constructor (creator,parent) {
    this.creator = creator;
    this.parent = parent;
    this.tBody = null;
//    this.sIndex = 0;
    this.displayTable();
  }

  displayTable() {
    var tbl, thead, tbody, row;
  
    tbl = document.createElement("table");
    tbl.id = `tbl_${this.creator.name}`;
    thead = document.createElement("thead");
    this.genThead(thead);
    tbody = document.createElement("tbody");
    this.tBody = tbody;
    this.fillTbody();
    tbl.appendChild(thead);
    tbl.appendChild(tbody);
    this.parent.innerHTML = "";
    this.parent.appendChild(tbl);
  }
  
  genThead(thead,columns) {
    let tr; let th; 
    let classes = ["fa-arrow-up","fa-arrow-down"];
  
    tr = document.createElement("tr");
    this.creator.columns.forEach((column,idx) => {
      th = document.createElement("th");
      th.textContent = column.label;
      th.style.width = column.width;
      if (column.sort) {
        let i = document.createElement("i");
        i.classList = `fa ${classes[column.dir]} arrow`;
        i.style.float = "right";
        column.elem = i;
        if (idx != this.creator.sIndex) i.classList.add("hidden");
        th.appendChild(i);
        th.title = "Click to sort on this column";
        th.onclick = () => this.toggleSort(idx, i);
      }
      tr.appendChild(th);
    });
    thead.appendChild(tr);
  }
  
  fillTbody() {
    let cel;
    this.tBody.innerHTML = "";
    let idx = 0;
    this.creator.data.forEach(rec => {
      idx++;
      let row = document.createElement("tr");
      row.id = this.creator.prefix + rec[this.creator.idfld];
      this.creator.columns.forEach(col => {
        if (col.type == "cel") this.addCell(row,rec[col.name],col.cls,col.width);
        else if (col.type == "lnk_Q") this.createHref(rec,row,col,"vaniquotes");
        else if (col.type == "lnk_S") this.createHref(rec,row,col,"vanisource");
        else if (col.type == "tgl") {
          cel = this.addCell(row,rec[col.name],col.cls,col.width);
          cel.addEventListener('click', (e) => this.toggleInclude(e,rec[this.creator.idfld]));
          row.classList.add(this.getRowClass(rec[col.name]));
        }
        // else if (col.type == "chb") this.addCheckBox(row, col.width, rec[this.creator.idfld], rec[col.name]);
        // else if (col.type == "var") rec[this.creator.varfld] = this.addCell(row, rec[col.name], col.cls, col.width);
      });
      this.tBody.appendChild(row);
    });
  }
  
  createHref(rec,row,col,petal) {
    let href = `https://${petal}.org/wiki/${rec[col.name].replaceAll(" ","_")}`;
    let instance = new HtmlA({href, target:"_blank", text:rec[col.name], cls:"mylink"});
    let cel = this.addCell(row,"",col.cls,col.width);
    cel.appendChild(instance.obj);
  }
  
  async toggleInclude(e,sqpl_idQ) {
    const td = e.target;
    const tr = td.parentElement;
    const current = td.textContent.trim(); 
    const currentIndex = includeValues.indexOf(current);
    const nextIndex = (currentIndex + 1) % includeValues.length;
    const nextValue = includeValues[nextIndex];
    if (! await this.creator.updateOneInclude(sqpl_idQ,nextValue)) return;
    td.textContent = nextValue;
    tr.classList.remove('row-yes', 'row-no', 'row-maybe');
    tr.classList.add(this.getRowClass(nextValue));
  }

  toggleSort(idx, obj) {
    let dir; let focus;
    let classes = ["fa-arrow-up","fa-arrow-down"];
  
    if (this.creator.sIndex == idx) {
      dir = this.creator.columns[idx].dir;
      dir = 1 - dir;
      this.creator.columns[idx].dir = dir;
      obj.classList.replace(classes[1 - dir],classes[dir]);
    }
    else {
      this.creator.columns[this.creator.sIndex].elem.classList.toggle("hidden");
      this.creator.columns[idx].elem.classList.toggle("hidden");
    }
    this.creator.sIndex = idx;
    this.creator.getPages(true);
  }

  addCell(row, text, cls, width) {
    let cel = document.createElement("td");
    cel.textContent = text;
    if (cls) cel.classList = cls;
    cel.style.width = width;
    row.appendChild(cel);
    return cel;
  }
  
  getRowClass(value) {
    switch (value) {
      case 'Y': return 'row-yes';
      case 'N': return 'row-no';
      case '?': return 'row-maybe';
      default: return '';
    }
  }
}
