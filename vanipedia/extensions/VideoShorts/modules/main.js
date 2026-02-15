var appLogic,vshLogic,trnLogic;

mw.hook('wikipage.content').add( function () {
  const key = mw.config.get('vsSessionKey');
  initPage('div_main', key);
});

async function initPage(parentId,session_key) {
  appLogic = new AppLogic(session_key);
  vshLogic = new VshLogic("english");
  trnLogic = new TrnLogic();
  await appLogic.renderHtml(document.getElementById(parentId),htmlElems);
  await vshLogic.drawContent();
  await trnLogic.drawContent();
  await vshLogic.drawModalWindows();
  await trnLogic.drawModalWindows();
  await trnLogic.drawControl();
  vshLogic.getVideos("");
  trnLogic.syncLanguage();
  appLogic.selectTab("english");
}

class AppLogic {
  constructor (session_key) {
    this.session_key = session_key;
    this.activeTab = [null,null];
    // this.removeLeftMargin();
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
  
  async getLanguages(parent) {
    const url = "/w/extensions/VideoShorts/src/util.php?func=getLanguages";
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        let instance = new HtmlOption({value:"0", text:"None", selected:true});
        parent.appendChild(instance.obj);
        Object.keys(data).forEach(key => {
          instance = new HtmlOption({value:key, text:data[key]});
          parent.appendChild(instance.obj);
        })      
      })
      .catch(error => {});
  }
  
  async getTransCodes(parent,lang_code) {
    const url = `/w/extensions/VideoShorts/src/util.php?func=getTransCodes&lang_code=${lang_code}`;
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        Object.keys(data).forEach(key => {
          let instance = new HtmlOption({value:key, text:data[key]});
          parent.appendChild(instance.obj);
        })      
      })
      .catch(error => {});
  }
  
  removeLeftMargin() {
    let elem = document.getElementById("content").parentNode.parentNode;
    elem.classList.remove("row");
  }
}

class DataTable {
  constructor (creator,sel_id,max_height,idx=0) {
    this.creator = creator;
    this.parentDiv = document.getElementById(`div_tbl_${creator.tabsheet}_${creator.name}`);
    this.tBody = null;
    this.sIndex = idx;
    this.selRow = null;
    this.selId = sel_id;
    this.displayTable(max_height);
  }

  displayTable(max_height) {
    var tbl, thead, arr, tbody, row;
  
    tbl = document.createElement("table");
    //tbl.id = `tbl_${this.creator.name}`;
    tbl.classList = `tbl_${this.creator.name}`;
    thead = document.createElement("thead");
    this.genThead(thead);
    tbody = document.createElement("tbody");
    tbody.style.maxHeight = max_height;
    this.tBody = tbody;
    this.fillTbody(false);
    tbl.appendChild(thead);
    tbl.appendChild(tbody);
    this.parentDiv.innerHTML = "";
    this.parentDiv.appendChild(tbl);
    if (!this.selId) {
      if (tbl.rows.length > 1) tbl.rows[1].onclick(true);
    }
    else {
      this.selRow.scrollIntoView({behavior:"smooth", block:"nearest", inline:"start"});
      this.selRow.onclick(true);
    }
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
  
  fillTbody(tbl_created) {
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
      let rec_id = rec[this.creator.idfld];
      if (rec_id == this.selId) this.selRow = row;
      row.id = this.creator.prefix + rec_id;
      row.onclick = (sync=true) => this.selectRow(row,rec_id,sync);
      row.tabIndex = "0";
      row.onkeydown = (event) => this.handleKey(row,event);
      this.creator.columns.forEach(col => {
//        this.addCell(row,rec[col.name], col.cls, col.width);
        
        if (col.type == "cel") this.addCell(row,rec[col.name], col.cls, col.width);
        else if (col.type == "chb") this.addCheckBox(row, col.width, col.name, rec[this.creator.idfld], rec[col.name], col.action);
        
      });
      this.tBody.appendChild(row);
    });
    if (tbl_created && this.selId) {
      this.selRow.scrollIntoView({behavior:"smooth", block:"nearest", inline:"start"});
      this.selRow.onclick(false);
    }
  }
  
  handleKey(row,event) {
    if ((event.keyCode == 38) || (event.keyCode == 40)) event.preventDefault();
    if (event.keyCode == 38) {
      let prev = row.previousElementSibling;
      if (prev) prev.click();
    }
    else if (event.keyCode == 40) {
      let next = row.nextElementSibling;
      if (next) next.click();
    }
  }
  
  async selectRow(row,rec_id,sync) {
    if (this.selId) this.selRow.classList.remove("selected");
    row.classList.add("selected");
    this.selRow = row;
    this.selId = rec_id;
    if (sync && this.creator.selectFunc) await this.creator.selectFunc(rec_id);
    row.focus();
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
    this.fillTbody(true);
  }

  addCell(row, text, cls, width) {
    let cel = document.createElement("td");
    cel.textContent = text;
    if (cls) cel.classList = cls;
    cel.style.width = width;
    row.appendChild(cel);
    return cel;
  }
  
  addCheckBox(row, width, col_name, rec_id, rec_select, rec_action) {
    let cel = document.createElement("td");
    let chb = document.createElement('input'); 
    chb.type = "checkbox"; 
    chb.checked = rec_select;
    chb.onclick = async () => {
      let ok = await rec_action(rec_id, chb.checked);
      if (!ok) chb.checked = !chb.checked;
      else this.creator.data.find(v => v[this.creator.idfld] == rec_id)[col_name] = chb.checked;
    }
    cel.style.width = width;
    cel.appendChild(chb);
    row.appendChild(cel);
  }
}
