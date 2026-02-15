class SetupLogic {
  constructor () {
    this.editing = false;
    this.complete = false;
    this.mandatory = [];
    this.translations = [];
    this.activeTab = [null,null];
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
  
  getSetupData() {
    hdr_trans_lang.textContent = `Language: ${appLogic.langName}`;
    const url = `/w/extensions/NDropTranslation/src/util.php?func=getSetupData&lang_code=${appLogic.langCode}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.editing = false;
        this.mandatory = [];
        this.translations = data;
        this.genTables();
        this.checkComplete();
      })
      .catch(error => {});
  }
  
  genTables() {
    this.genTable(tbl_su_general, (tran)=> {return tran.catg == 1 || tran.catg == 3}, true, "400px");
    this.genTable(tbl_su_locations, (tran)=> {return tran.catg == 2}, false, "275px");
    this.genTable(tbl_su_years, (tran)=> {return tran.catg == 4}, false, "100px");
  }
  
  genTable(parent,func,mandatory,inp_width) {
    let rows = this.genRows(this.translations.filter(func),mandatory,inp_width);
    let instance = new HtmlTable({border:1, cls:"setup_tbl", rows});
    parent.innerHTML = "";
    parent.appendChild(instance.obj);
  }
  
  genRows(arr,mandatory,inp_width) {
    let rows = []; let style; let instance;
    arr.forEach((tran,index) => {
      let idx = index;
      if (!mandatory || tran.idT) style = {width:inp_width};
      else style = {width:inp_width, "border-color":"red"}
      instance = new HtmlInput({type:"text", value:tran.text, cls:"translation", size:32, style, readonly:true});
      let inp = instance.obj;
      instance = new HtmlButton({text:"Edit", onclick:()=>this.editTrans(inp,tran,mandatory,idx)});
      let btn_edit = instance.obj;
      if (mandatory) this.mandatory.push(tran);
      rows.push([tran.code, inp, btn_edit]);
    });
    return rows;
  }
  
  editTrans(inp,tran,mandatory,idx) {
    if (this.editing) return;
    let td = inp.parentNode.nextSibling;
    let btn = td.removeChild(td.firstChild);
    let val = inp.value;
    let instance = new HtmlButton({text:"Submit", style:{"margin-right":"5px"}, onclick:()=>this.submitTrans(inp,td,btn,tran,mandatory,idx)});
    let btn_submit = instance.obj;
    instance = new HtmlButton({text:"Cancel", onclick:()=>this.cancelTrans(inp,td,btn,val)});
    let btn_cancel = instance.obj;
    td.appendChild(btn_submit);
    td.appendChild(btn_cancel);
    inp.readOnly = false;
    inp.focus();
    this.editing = true;
  }
  
  submitTrans(inp,td,btn,tran,mandatory,idx) {
    const url = `/wiki/Special:NDropTrans/upd_setup?tran_catg=${tran.catg}&tran_code=${tran.code}&tran_text=${inp.value.trim()}&lang_code=${appLogic.langCode}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.error) this.showError(data.error);
        else {
          if (!ndropLogic.translation.id) ndropLogic.getNdropData(ndropLogic.english.id,true);
          if (mandatory) {
            this.mandatory[idx].idT = data.idT;
            if (data.idT) inp.style.removeProperty("border-color");
            else {
              inp.value = this.mandatory[idx].english;
              inp.style.borderColor = "red";
            }
            this.checkComplete();
          }
          this.hideError();
          this.finishEdit(inp,td,btn);
        }
      })
      .catch(error => {});
  }
  
  cancelTrans(inp,td,btn,val) {
    inp.value = val;
    this.hideError();
    this.finishEdit(inp,td,btn);
  }
  
  finishEdit(inp,td,btn) {
    td.innerHTML = "";
    td.appendChild(btn);
    inp.readOnly = true;
    this.editing = false;
  }
  
  checkComplete() {
    let complete = true; 
    this.mandatory.forEach(tran => {if (!tran.idT) complete = false});
    this.complete = complete;
  }
  
  showError(error) {
    div_setup_warning.textContent = error;
    div_setup_warning.style.display = "block";
  }
  
  hideError() {
    div_setup_warning.textContent = "";
    div_setup_warning.style.display = "none";
  }
}