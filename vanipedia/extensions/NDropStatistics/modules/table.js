class TblLogic {
  constructor () {
    this.total = 0;
    this.dimspec = {horiz:"", vertic:"", unit:""}; /* used to determine the compare function in sort */
    this.horiz = {labels:[], totals:[], sortindex:1, sortdata:[], sortmap:[]};
    this.vertic = {labels:[], totals:[], sortindex:1, sortdata:[], sortmap:[]};
    this.dataMatrix = [];
    this.htmlTbl = null;
    this.parentElem = null;
    this.csvText = "";
    this.arrowClasses = {
      horiz:["fa-arrow-up","fa-arrow-down"],
      vertic:["fa-arrow-left","fa-arrow-right"]
    };
  }
  
  getStatistics() {
    const url = "/w/extensions/NDropStatistics/src/util.php?func=getStatistics";
    
    this.dimspec.horiz = sel_horiz.value;
    this.dimspec.vertic = sel_vertic.value;
    this.dimspec.unit = document.querySelector("input[name='time_unit']:checked").value;
    appLogic.configToUrl();
    
    let params = new FormData();
    params.append("date_from", date_from.value);
    params.append("date_until", date_until.value);
    params.append("time_unit", this.dimspec.unit);
    params.append("user_id", sel_user.value);
    params.append("lang_id", sel_lang.value);
    params.append("horiz", this.dimspec.horiz);
    params.append("vertic", this.dimspec.vertic);
    fetch(url, {method:"POST", body:params})
      .then(response => response.json())
      .then(data => {
        this.horiz.labels = data.horiz;
        this.vertic.labels = data.vertic;
        this.dataMatrix = data.matrix;
        this.prepareData();
        this.sort("horiz",1,false);
        this.sort("vertic",1,true);
      })
      .catch(error => {});
  }
  
  genTable() {
    let tbl = document.createElement("table");
    let row = this.genRow(this.horiz.labels,"","Total",true,0,false); /* header row */
    tbl.appendChild(row);
    row = this.genRow(this.horiz.totals,"Total",this.total,false,1,true); /* total row */
    tbl.appendChild(row);
    for (let r = 0; r < this.dataMatrix.length; r++) {
      if (sel_vertic.value == "Q") continue; /* skip the only 'total' row */
      let mapidx = this.mapIdx("vertic",r);
      let arr = this.dataMatrix[mapidx];
      row = this.genRow(arr,this.vertic.labels[mapidx],this.vertic.totals[mapidx],false,r+2,false);
      tbl.appendChild(row);
    }
    return tbl;
  }

  genRow(arr,first,second,header,idx,total) {
    let row = document.createElement("tr");
    let cls = (header ? "text" : "number");
    row.appendChild(this.genCel("text",first,"vertic",idx,false));
    row.appendChild(this.genCel(cls,second,"horiz",1,!header));
    for (let c = 0; c < arr.length; c++) {
      if (sel_horiz.value == "Q") continue; /* skip the only 'total' column */
      let val = arr[this.mapIdx("horiz",c)];
      row.appendChild(this.genCel(cls,val,"horiz",c+2,total));
    }
    return row;
  }

  genCel(cls,value,dim,idx,total) {
    let cel = this.createCel(cls + (total ? " total": ""));
    if (cls == "number") cel.textContent = (value ? value : "");
    else {
      if (value) {
        let div1 = this.createDiv("left",value);
        cel.appendChild(div1);
        let div2 = this.createDiv("right","");
        let sortidx = this.sortIdx(dim,idx);
        if (sortidx == this[dim].sortindex) div2.classList.add("active");
        this[dim].sortdata[sortidx].elem = div2;
        let dir = this[dim].sortdata[sortidx].dir;
        div1 = this.createDiv(`fa ${this.arrowClasses[dim][dir]}`,"");
        div2.appendChild(div1);
        cel.appendChild(div2);
        cel.classList.add("sortable");
        cel.onclick = () => this.sort(dim,sortidx,true);
      } else {
        this.genCornerDiv(cel,"horiz",idx,"Click to sort on the vertical labels");
        this.genCornerDiv(cel,"vertic",idx,"Click to sort on the horizontal labels");
      }
    }
    return cel;
  }
  
  genCornerDiv(cel,dim,idx,title) {
    let sortidx = this.sortIdx(dim,idx);
    let dir = this[dim].sortdata[sortidx].dir;
    let div = this.createDiv(`fa ${this.arrowClasses[dim][dir]}`,"");  
    div.classList.add("sortable","corner");
    if (sortidx == this[dim].sortindex) div.classList.add("active");
    this[dim].sortdata[sortidx].elem = div;
    div.title = title;
    div.onclick = () => this.sort(dim,sortidx,true);
    cel.appendChild(div);
  }

  sort(dim,idx,draw) {
    if (idx == this[dim].sortindex) {
      let dir = 1 - this[dim].sortdata[idx].dir;
      this[dim].sortdata[idx].dir = dir; 
    }
    this[dim].sortindex = idx;
    this.computeSortMap(dim,idx);
    if (draw) {
      if (this.htmlTable) this.htmlTable.remove();
      let tbl = this.genTable();
      this.parentElem.appendChild(tbl);
      this.htmlTable = tbl;
    }
  }

  computeSortMap(dim,idx) {
    let val1; let val2; let tmp;
    let sortdim = (dim == "horiz" ? "vertic" : "horiz");
    let sortdir = this[dim].sortdata[idx].dir;
    let func = 
      ((idx == 0) && (this.dimspec[sortdim] == "T") && (this.dimspec.unit == "M") ? 
       (a,b,dir) => this.compareMonths(a,b,dir) :
       (a,b,dir) => this.compareValues(a,b,dir));
    
    for (let i = 0; i < this[sortdim].sortmap.length - 1; i++) {
      let minmax = i; 
      for (let j = i + 1; j < this[sortdim].sortmap.length; j++) {
        if (idx == 0) { /* labels */
          val1 = this[sortdim].labels[this[sortdim].sortmap[j]];
          val2 = this[sortdim].labels[this[sortdim].sortmap[minmax]];
        } else if (idx == 1) { /* totals */
          val1 = this[sortdim].totals[this[sortdim].sortmap[j]];
          val2 = this[sortdim].totals[this[sortdim].sortmap[minmax]];
        } else { /* data */
          if (sortdim == "horiz") {
            val1 = this.dataMatrix[idx-2][this[sortdim].sortmap[j]];
            val2 = this.dataMatrix[idx-2][this[sortdim].sortmap[minmax]];
          } else {
            val1 = this.dataMatrix[this[sortdim].sortmap[j]][idx-2];
            val2 = this.dataMatrix[this[sortdim].sortmap[minmax]][idx-2];
          }
        }
        if (func(val1,val2,sortdir)) minmax = j;
      }
      if (minmax != i) {
        tmp = this[sortdim].sortmap[i];
        this[sortdim].sortmap[i] = this[sortdim].sortmap[minmax];
        this[sortdim].sortmap[minmax] = tmp;
      }
    }
  }
  
  compareMonths(a,b,dir) {
    let months = {"Jan":"01","Feb":"02","Mar":"03","Apr":"04","May":"05","Jun":"06","Jul":"07","Aug":"08","Sep":"09","Oct":"10","Nov":"11","Dec":"12"};
    let arr = a.split("-");
    a = arr[0] + months[arr[1]];
    arr = b.split("-");
    b = arr[0] + months[arr[1]];
    return (dir == 0 ? a < b : a > b);
  }
  
  compareValues(a,b,dir) {
    return (dir == 0 ? a < b : a > b);
  }
  
  prepareData() {
    let total;
    
    this.csvText = "";
    this.horiz.totals = []; this.horiz.sortmap = []; this.horiz.sortdata = []; this.horiz.sortindex = 1;
    this.vertic.totals = []; this.vertic.sortmap = []; this.vertic.sortdata = []; this.vertic.sortindex = 1;
    
    this.horiz.sortdata.push({elem:null,dir:0}); /* label */
    this.horiz.sortdata.push({elem:null,dir:0}); /* total */
    this.vertic.sortdata.push({elem:null,dir:0}); /* label */
    this.vertic.sortdata.push({elem:null,dir:0}); /* total */
    
    this.horiz.labels.forEach((lab,idx)=> {
      total = 0;
      this.dataMatrix.forEach(row => total += row[idx]);
      this.horiz.totals[idx] = total;
      this.horiz.sortmap.push(idx);
      this.horiz.sortdata.push({elem:null,dir:1});
    });

    this.vertic.labels.forEach((lab,idx)=> {
      total = 0;
      this.dataMatrix[idx].forEach(val => total += val);
      this.vertic.totals[idx] = total;
      this.vertic.sortmap.push(idx);
      this.vertic.sortdata.push({elem:null,dir:1});
    });
    
    total = 0;
    this.horiz.totals.forEach(val => total += val);
    this.total = total;
  }

  mapIdx(dim,idx) {
    return this[dim].sortmap[idx];
  }

  sortIdx(dim,idx) {
    return (idx < 2 ? idx : this[dim].sortmap[idx - 2] + 2);
  }

  createDiv(cls,txt) {
    let div = document.createElement("div");
    if (cls) div.classList = cls;
    if (txt) div.textContent = txt;
    return div;
  }

  createCel(cls) {
    let cel = document.createElement("td");
    if (cls) cel.classList = cls;
    return cel;
  }
  
  genCsv() {
    let csv = "";
    csv += `;Total;${this.horiz.labels.join(";")}\n`;
    csv += `Total;${this.total};${this.horiz.totals.join(";")}\n`;
    for (let r = 0; r < this.dataMatrix.length; r++) {
      csv += `${this.vertic.labels[r]};${this.vertic.totals[r]};${this.dataMatrix[r].join(";")}\n`;
    }
    return csv;
  }
}
