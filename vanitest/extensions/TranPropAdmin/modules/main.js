var appLogic,trprMaster,tranMaster,trprDetail;

mw.hook('wikipage.content').add( function () {
  initPage('div_main');
});

async function initPage(parentId) {
  appLogic = new AppLogic();
  trprMaster = new TRPRMaster();
  tranMaster = new TRANMaster();
  trprDetail = new TRPRDetail
  await appLogic.renderHtml(document.getElementById(parentId),htmlElems);
  appLogic.selectTab("trpr_master");
  trprMaster.getTRPR();
  tranMaster.getTRAN();
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
  
  async getProperties(parent,zero) {
    const url = "/w/extensions/TranPropAdmin/src/util.php?func=getProperties";
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        let instance = (zero ? new HtmlOption({value:"0", text:"All", selected:true}) : null);
        if (zero) parent.appendChild(instance.obj);
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
    this.parentDiv = document.getElementById(`div_tbl_${this.creator.name}`);
    this.tBody = null;
    this.sIndex = idx;
    this.selRow = null;
    this.displayTable();
  }

  displayTable() {
    var tbl, thead, arr, tbody, row;
  
    tbl = document.createElement("table");
    tbl.id = `tbl_${this.creator.name}`;
    tbl.classList = "data_table";
    tbl.tabIndex = 1;
    if (this.creator.selFunc) tbl.onkeydown = (event) => this.handleArrow(event);
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
    let idx; let name; let dir; let selrowid;

    if (this.selRow) selrowid = this.selRow.id;
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
      if (row.id == selrowid) this.selRow = row;
      row.onclick = (event) => this.rowSelect(event,row);
      this.creator.columns.forEach(col => {
        if (col.type == "cel") {
          if ((col.cls == "transtext")||(col.cls == "breakword")) {
            let text = (col.cls == "breakword" ? rec[col.name] : this.markText(rec[col.name],rec.trpr_from,rec.trpr_until));
            this.addCell(true,row, text, "transtext", col.width);
          }
          else this.addCell(false,row, rec[col.name], col.cls, col.width);
        }
        else if (col.type == "chb") this.addCheckBox(row, col.width, rec[this.creator.idfld], rec[col.name]);
        else if (col.type == "var") rec[this.creator.varfld] = this.addCell(false,row, rec[col.name], col.cls, col.width);
      });
      this.tBody.appendChild(row);
    });
  }
  
  rowSelect (event,row) {
    let obj = event.target;
    if (obj.classList.contains("special")) return;

    if (this.selRow) this.selRow.classList.remove("selrow");
    this.selRow = row;
    row.classList.add("selrow");
    //g_focus = g_sel_row.id;
    
    if (this.creator.selFunc) this.creator.selFunc(row);
  }
  
  markText (v_text,v_from,v_until) {
    let result =
      v_text.substr(0,v_from) + "<mark>" +
      v_text.substr(v_from,v_until - v_from + 1) + "</mark>" +
      v_text.substr(v_until + 1);
    return result;
  }
  
  markSelection () {
    const selObj = window.getSelection();
    let el = selObj.anchorNode;
    let foc = selObj.focusNode;
    if (el.parentNode.tagName === "MARK") el = el.parentNode;
    if (foc.parentNode.tagName === "MARK") foc = foc.parentNode;
    if (el.parentNode != foc.parentNode) { alert("Selection should be limited to one cell"); return; }
    let cel = el.parentNode;
    let row = cel.parentNode;
    if (cel !== row.cells[2]) { alert("Selection should be in the 'Translation' column"); return; }
    let children = Array.from(cel.childNodes);
    let info = this.genHTMLinfo(selObj,el,foc,children);
    cel.innerHTML = info.html;
    row.cells[3].textContent = info.from;
    row.cells[4].textContent = info.until - 1;
    /**/
    let trpr_id = row.id.split("_"); 
    let rec = this.creator.data.find(v => v["trpr_id"] == `${trpr_id[1]}_${trpr_id[2]}_${trpr_id[3]}`);
    rec.trpr_from = info.from;
    rec.trpr_until = info.until - 1;
    this.setTRPR(trpr_id,info.from,info.until - 1);
  }
  
  setTRPR (trpr_id,p_from,p_until) {
    const url = "/w/extensions/TranPropAdmin/src/util.php?func=setTRPR";
    let params = new FormData();
    params.append("tran_id", trpr_id[1]);
    params.append("prop_id", trpr_id[2]);
    params.append("trpr_seq", trpr_id[3]);
    params.append("from", p_from);
    params.append("until", p_until);
    fetch(url, {method:"POST", body:params});
  }
  
  genHTMLinfo (obj,el,foc,children) {
    let v_text = "";
    let rng = obj.getRangeAt(0);
    let v_start = rng.startOffset;
    let v_end = rng.endOffset;
    let v_from = 0; let v_until = 0;
    let v_from_set = false; let v_until_set = false;
    for (var i=0; i<children.length; i++) {
      if (children[i] === el) {
        v_text += children[i].textContent.substr(0,v_start) + "<mark>";
        v_from += v_start; v_from_set = true;
        v_until = v_from;
        if (el === foc) { v_text += obj.toString(); v_until += obj.toString().length; v_until_set = true }
        else { let v_tmp = children[i].textContent.substr(v_start); v_text += v_tmp; v_until += v_tmp.length }
      }
      if ((children[i] !== el) && (children[i] !== foc)) {
        v_text += children[i].textContent;
        if (!v_from_set) v_from += children[i].textContent.length;
        if (!v_until_set) v_until += children[i].textContent.length;
      }
      if (children[i] === foc) {
        if (el !== foc) v_text += children[i].textContent.substr(0,v_end);
        v_text += "</mark>" + children[i].textContent.substr(v_end);
        if (!v_until_set) { v_until += v_end; v_until_set = true; }
      }
    }
    return {"html":v_text, "from":v_from, "until":v_until};
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
    
    if (this.selRow) {
      this.selRow.click();
      this.selRow.scrollIntoView({behavior:"smooth", block:"nearest", inline:"start"});
    }
  }

  addCell(html,row, text, cls, width) {
    let cel = document.createElement("td");
    if (html) cel.innerHTML = text; else cel.textContent = text;
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
  }
  
  checkRecord(chb, rec_id) {
    this.creator.data.find(v => v[this.creator.idfld] == rec_id)[this.creator.selfld] = chb.checked;
  }
  
  handleArrow(e) {
    if (!this.selRow) return;
    e.preventDefault();
    switch (e.keyCode) {
    case 39:
      { this.rowLast(); break }
    case 37:
      { this.rowFirst(); break }
    case 38:
      { this.rowUp(); break }
    case 40:
      { this.rowDown(); break }
    }
  }

  rowFirst() {
    let first = this.selRow.parentNode.firstElementChild;
    if (!first) return;
    this.selectRow(first);
  }

  rowLast() {
    let last = this.selRow.parentNode.lastElementChild;
    if (!last) return;
    this.selectRow(last);
  }

  rowUp() {
    let prev = this.selRow.previousElementSibling;
    if (!prev) return;
    this.selectRow(prev);
  }

  rowDown() {
    let next = this.selRow.nextElementSibling;
    if (!next) return;
    this.selectRow(next);
  }

  selectRow(row) {
    row.scrollIntoView({behavior:"smooth", block:"nearest", inline:"start"});
    row.click();
  }
}
