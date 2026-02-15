var appLogic,sttLogic,vqsLogic,vqhLogic;

mw.hook('wikipage.content').add( function () {
  initPage('div_main');
});

async function initPage(parentId) {
  appLogic = new AppLogic();
  sttLogic = new SttLogic();
  vqsLogic = new VqsLogic();
  vqhLogic = new VqhLogic();
  await appLogic.renderHtml(document.getElementById(parentId),htmlElems);
  appLogic.selectTab("categories");
  sttLogic.getVanis();
  vqsLogic.getVqSections();
  vqhLogic.getVqHistory();
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
  
  async getVaniTypes(parent) {
    const url = "/w/extensions/QuotesAdmin/src/util.php?func=getVaniTypes";
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        let instance = new HtmlOption({value:"0", text:"All", selected:true});
        parent.appendChild(instance.obj);
        Object.keys(data).forEach(key => {
          instance = new HtmlOption({value:key, text:data[key]});
          parent.appendChild(instance.obj);
        })      
      })
      .catch(error => {});
  }
}

class DataTable {
  constructor (creator,idx=0) {
    this.creator = creator;
    this.parentDiv = document.getElementById(`div_tbl_${creator.name}`);
    this.tBody = null;
    this.sIndex = idx;
    this.displayTable();
  }

  displayTable() {
    var tbl, thead, arr, tbody, row;
  
    tbl = document.createElement("table");
    tbl.id = `tbl_${this.creator.name}`;
    thead = document.createElement("thead");
    this.genThead(thead);
    tbody = document.createElement("tbody");
    this.tBody = tbody;
    this.fillTbody();
    tbl.appendChild(thead);
    tbl.appendChild(tbody);
    this.parentDiv.innerHTML = "";
    this.parentDiv.appendChild(tbl);
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
        if (idx != this.sIndex) i.classList.add("hidden");
        i.style.float = "right";
        column.elem = i;
        th.appendChild(i);
        th.title = "Click to sort on this column";
        th.onclick = () => this.toggleSort(idx, i);
      }
      tr.appendChild(th);
    });
    thead.appendChild(tr);
  }
  
  fillTbody() {
    let idx; let name; let dir;

    this.tBody.innerHTML = "";
    name = this.creator.columns[this.sIndex].name;
    dir = this.creator.columns[this.sIndex].dir;
    
    if (dir == 0) this.creator.data.sort((a, b)=>
      {if (a[name] < b[name]) return -1; if (a[name] > b[name]) return 1; return 0});
    else this.creator.data.sort((a, b)=>
      {if (a[name] < b[name]) return 1; if (a[name] > b[name]) return -1; return 0});

    idx = 0;
    this.creator.data.forEach(rec => {
      idx++;
      let row = document.createElement("tr");
      row.id = this.creator.prefix + rec[this.creator.idfld];
      this.creator.columns.forEach(col => {
        if (col.type == "cel") this.addCell(row,rec[col.name], col.cls, col.width);
        else if (col.type == "chb") this.addCheckBox(row, col.width, rec[this.creator.idfld], rec[col.name]);
        else if (col.type == "var") rec[this.creator.varfld] = this.addCell(row, rec[col.name], col.cls, col.width);
      });
      this.tBody.appendChild(row);
    });
  }
  
  toggleSort(idx, obj) {
    let dir; let focus;
    let classes = ["fa-arrow-up","fa-arrow-down"];
  
    if (this.sIndex == idx) {
      dir = this.creator.columns[idx].dir;
      dir = 1 - dir;
      this.creator.columns[idx].dir = dir;
      obj.classList.replace(classes[1 - dir],classes[dir]);
    }
    else {
      this.creator.columns[this.sIndex].elem.classList.toggle("hidden");
      this.creator.columns[idx].elem.classList.toggle("hidden");
    }
    this.sIndex = idx;
    this.fillTbody();
  }

  addCell(row, text, cls, width) {
    let cel = document.createElement("td");
    cel.textContent = text;
    if (cls) cel.classList = cls;
    cel.style.width = width;
    row.appendChild(cel);
    return cel;
  }
  
  addCheckBox(row, width, rec_id, rec_select) {
    let cel = document.createElement("td");
    let chb = document.createElement('input'); 
    chb.type = "checkbox"; 
    chb.checked = rec_select;
    chb.onclick = ()=>this.checkRecord(chb, rec_id);
    cel.style.width = width;
    cel.appendChild(chb);
    row.appendChild(cel);
  }
  
  checkAll(check) {
    let checkboxes = Array.from(this.tBody.querySelectorAll("input[type='checkbox']"));
    checkboxes.forEach((box) => { if (box.checked != check) box.checked = check }); 
    this.creator.data.forEach((v)=> v[this.creator.selfld] = check);
    this.creator.selFunc();
  }
  
  checkRecord(chb, rec_id) {
    this.creator.data.find(v => v[this.creator.idfld] == rec_id)[this.creator.selfld] = chb.checked;
    this.creator.selFunc();
  }
}
