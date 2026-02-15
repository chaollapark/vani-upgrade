class VshLogic {
  constructor (tabsheet) {
    this.tabsheet = tabsheet;
    this.name = "videos";
    this.prefix = "vish_";
    this.idfld = "vish_id";
    this.lang_code = "en";
    this.selectFunc = (vish_id) => this.vshSelect(vish_id);
    this.data = [];
    this.dataTable = null;
    this.creating = false;
    this.vli = new VliLogic(tabsheet);
    this.columns = [
      {name:"vish_code", label:"Code", width:"65px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vish_title", label:"Title", width:"415px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vish_ref", label:"Reference", width:"190px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vish_url", label:"URL", width:"315px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vish_date", label:"Date", width:"100px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vish_ready", label:"F", width:"30px", sort:true, dir:0, elem:null, type:"chb", action:(id,ready) => this.vshReady(id,ready), cls:""}
    ];
  }

  async vshReady(vish_id,vish_ready) {
    let ok = false;
    const url = `/w/extensions/VideoShorts/src/util.php?func=vshReady&sess_key=${appLogic.session_key}&vish_id=${vish_id}&vish_ready=${+vish_ready}`;
    await fetch(url)
      .then((resp) => resp.json())
      .then((data) => ok = !data.error)
      .catch(function(error) {});
    return ok;
  }
  
  async drawContent() {
    let parent = document.getElementById(`div_${this.tabsheet}`);
    let htmlElems = [
     {className:"HtmlDiv", id:`div_control_${this.tabsheet}`, children:[
      ]},
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlButton", cls:"cmdbutton", text:"Insert", onclick:()=>this.vshInsert()},
           {className:"HtmlButton", cls:"cmdbutton", text:"Update", onclick:()=>this.vshEdit()},
           {className:"HtmlButton", cls:"cmdbutton", text:"Delete", onclick:()=>this.vshDelete()},
         ]}
      ]},
     {className:"HtmlDiv", id:`div_tbl_${this.tabsheet}_videos`},
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", cls:"headerblock", children: (this.tabsheet == "english" ? [
           {className:"HtmlButton", cls:"cmdbutton", text:"Insert", onclick:()=>this.vli.vliInsert()},
           {className:"HtmlButton", cls:"cmdbutton", text:"Update", onclick:()=>this.vli.vliEdit(this)},
           {className:"HtmlButton", cls:"cmdbutton", text:"Delete", onclick:()=>this.vli.vliDelete(this)},
           {className:"HtmlButton", cls:"cmdbutton", text:"Move Up", onclick:()=>this.vli.vliMoveUp()},
           {className:"HtmlButton", cls:"cmdbutton", text:"Move Down", onclick:()=>this.vli.vliMoveDown()}
         ] : [
           {className:"HtmlButton", cls:"cmdbutton", text:"Update", onclick:()=>this.vli.vliEdit(this)},
           {className:"HtmlButton", cls:"cmdbutton", text:"Move Up", onclick:()=>this.vli.vliMoveUp()},
           {className:"HtmlButton", cls:"cmdbutton", text:"Move Down", onclick:()=>this.vli.vliMoveDown()}
         ])}
      ]},
     {className:"HtmlDiv", children:[
        {className:"HtmlDiv", id:`div_tbl_${this.tabsheet}_lines`, cls:"headerblock"},
        {className:"HtmlDiv", cls:"headerblock", children:[
           {className:"HtmlIframe", id:`ifr_${this.tabsheet}_video`, height:"360", width:"260"}
         ]}
      ]}
    ];
    await appLogic.renderHtml(parent,htmlElems);
  }
  
  async drawModalWindows() {
    let htmlElems = [
     {className:"HtmlDiv", id:`div_vish_english_edit`, cls:"modal-wrapper", children:[
        {className:"HtmlDiv", cls:"modal-content animate", style:{width: "45em"}, children:[
           {className:"HtmlSpan", cls:"modal-close", onclick:()=>this.hideEdit()},
           {className:"HtmlDiv", cls:"modal-block", children:[
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Code", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_english_code`, type:"text", cls:"edit w50", maxlength:"4"}
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Title", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_english_title`, type:"text", cls:"edit w600", maxlength:"75"}
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Reference", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_english_ref`, type:"text", cls:"edit w400", maxlength:"50"}
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"URL", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_english_url`, type:"text", cls:"edit w400", maxlength:"50"}
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Date", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_english_date`, type:"date", cls:"edit"}
              ]},
              {className:"HtmlButton", id:`but_vish_english_submit`, cls:"modal-button", text:"Submit", onclick:()=>this.vshSubmit(this.lang_code)},
              {className:"HtmlButton", cls:"modal-button", text:"Cancel", style:{float: "right"}, onclick:()=>this.hideEdit()},
              {className:"HtmlDiv", id:`div_vish_english_fail`, cls:"modal-error"}
            ]}
         ]}
      ]},
     {className:"HtmlDiv", id:`div_vsli_english_edit`, cls:"modal-wrapper", children:[
        {className:"HtmlDiv", cls:"modal-content animate", style:{width: "50em"}, children:[
           {className:"HtmlSpan", cls:"modal-close", onclick:()=>this.vli.hideEdit()},
           {className:"HtmlDiv", cls:"modal-block", children:[
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Seq", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_english_seq`, type:"text", cls:"edit w50", maxlength:"2", readonly:true}
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Text", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_english_text`, type:"text", cls:"edit w600", maxlength:"75"}
              ]},
              {className:"HtmlButton", id:`but_vsli_english_submit`, cls:"modal-button", text:"Submit", onclick:()=>this.vli.vliSubmit()},
              {className:"HtmlButton", cls:"modal-button", text:"Cancel", style:{float: "right"}, onclick:()=>this.vli.hideEdit()},
              {className:"HtmlDiv", id:`div_vsli_english_fail`, cls:"modal-error"}
            ]}
         ]}
      ]}
    ];
    await appLogic.renderHtml(document.body,htmlElems);
  }
  
  getVideos(vish_code) {
    const url = `/w/extensions/VideoShorts/src/util.php?func=getVideos&lang_code=${this.lang_code}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data; 
        let vish_id = 0;
        if (vish_code) vish_id = this.data.find((rec) => { return rec.vish_code == vish_code }).vish_id;
        this.dataTable = new DataTable(this,vish_id,"141px");
        // empty detail-frame when master-frame is empty
        if (!data.length) {
          this.vli.dataTable.parentDiv.innerHTML = ""; 
          document.getElementById(`ifr_${this.tabsheet}_video`).src = "";
        }
      })
      .catch(function(error) {});
  }
  
  async vshSelect(vish_id) {
    this.vli.vish_id = vish_id;
    await this.vli.getLines("");
    let vish = this.data.find((rec) => { return rec.vish_id == vish_id });
    document.getElementById(`ifr_${this.tabsheet}_video`).src = "//" + vish.vish_url;
  }
  
  vshInsert() {
    this.showEdit();
    inp_english_code.value = "";
    inp_english_title.value = "";
    inp_english_ref.value = "";
    inp_english_url.value = "";
    inp_english_date.value = "";
    but_vish_english_submit.textContent = "Insert";
    this.creating = true;
  }
  
  vshEdit() {
    let vish_id = this.dataTable.selId;
    if (!vish_id) return;
    this.showEdit();
    let vish = this.data.find((rec) => { return rec.vish_id == vish_id });
    inp_english_code.value = vish.vish_code;
    inp_english_title.value = vish.vish_title;
    inp_english_ref.value = vish.vish_ref;
    inp_english_url.value = vish.vish_url;
    inp_english_date.value = vish.vish_date;
    but_vish_english_submit.textContent = "Update";
    this.creating = false;
  }
  
  vshDelete() {
    let vish_id = this.dataTable.selId;
    if (!vish_id) return;
    if (!confirm("Are you sure you want to delete this video?")) return;
    const url = `/w/extensions/VideoShorts/src/util.php?func=vshDelete&sess_key=${appLogic.session_key}&vish_id=${vish_id}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        if (data.error == "") this.getVideos("");
      })
      .catch(function(error) {});
  }
  
  vshSubmit(lang_code) {
    if (!this.vshValid()) return;
    let formData = new FormData();
    let vish = {
      vish_id: (this.creating ? 0 : this.dataTable.selId),
      vish_code: (lang_code == "en" ? inp_english_code.value.trim() : sel_translation_code.value),
      vish_title: document.getElementById(`inp_${this.tabsheet}_title`).value.trim(),
      vish_ref: document.getElementById(`inp_${this.tabsheet}_ref`).value.trim(),
      vish_url: document.getElementById(`inp_${this.tabsheet}_url`).value.trim(),
      vish_date: document.getElementById(`inp_${this.tabsheet}_date`).value
    };
    formData.append("vish", JSON.stringify(vish));
    const url = `/w/extensions/VideoShorts/src/util.php?func=vshSubmit&sess_key=${appLogic.session_key}&creating=${+this.creating}&lang_code=${lang_code}`;
    fetch(url, {
      method: 'POST',
      body: formData})
    .then((resp) => resp.json())
    .then((data) => {
      if (data.error != "") {
        document.getElementById(`div_vish_${this.tabsheet}_fail`).textContent = data.error;
      } else {
        this.hideEdit();
        this.getVideos(vish.vish_code);
      }
    })
    .catch(function(error) {
    });
  }
  
  vshValid() {
    div_vish_english_fail.textContent = "";
    if (inp_english_code.value.trim() > "") return true;
    else {
      div_vish_english_fail.textContent = "Code is mandatory";
      return false;
    }
  }
  
  showEdit() {
    div_vish_english_edit.style.display = "block";
    inp_english_code.focus();
  }

  hideEdit() {
    document.getElementById(`div_vish_${this.tabsheet}_edit`).style.display = "none";
    document.getElementById(`div_vish_${this.tabsheet}_fail`).textContent = "";
  }
}

class VliLogic {
  constructor (tabsheet) {
    this.tabsheet = tabsheet;
    this.name = "lines";
    this.prefix = "vsli_";
    this.idfld = "vsli_id";
    this.selectFunc = null;
    this.data = [];
    this.dataTable = null;
    this.creating = false;
    this.vish_id = 0;
    this.columns = [
      {name:"vsli_seq", label:"Seq", width:"65px", sort:false, dir:0, elem:null, type:"cel", cls:""},
      {name:"vsli_text", label:"Text", width:"755px", sort:false, dir:0, elem:null, type:"cel", cls:""}
    ];
  }

  async getLines(vsli_seq) {
    const url = `/w/extensions/VideoShorts/src/util.php?func=getLines&vish_id=${this.vish_id}`;
    await fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data; 
        let vsli_id = 0;
        if (vsli_seq) vsli_id = this.data.find((rec) => { return rec.vsli_seq == vsli_seq }).vsli_id;
        this.dataTable = new DataTable(this,vsli_id,"309px");
      })
      .catch(function(error) {});
  }
  
  vliInsert() {
    if (this.vish_id == 0) return;
    this.showEdit();
    inp_english_seq.value = "";
    inp_english_text.value = "";
    but_vsli_english_submit.textContent = "Insert";
    this.creating = true;
  }

  vliEdit() {
    if (this.vish_id == 0) return;
    let vsli_id = this.dataTable.selId;
    if (!vsli_id) return;
    this.showEdit();
    let vsli = this.data.find((rec) => { return rec.vsli_id == vsli_id });
    inp_english_seq.value = vsli.vsli_seq;
    inp_english_text.value = vsli.vsli_text;
    but_vsli_english_submit.textContent = "Update";
    this.creating = false;
  }
  
  vliDelete(master) {
    if (this.vish_id == 0) return;
    let vsli_id = this.dataTable.selId;
    if (!vsli_id) return;
    if (!confirm("Are you sure you want to delete this line?")) return;
    const url = `/w/extensions/VideoShorts/src/util.php?func=vliDelete&sess_key=${appLogic.session_key}&vsli_id=${vsli_id}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        if (data.error == "") master.vshSelect(this.vish_id);
      })
      .catch(function(error) {});
  }

  vliSubmit() {
    if (!this.vliValid()) return;
    let formData = new FormData();
    let vsli = {
      vish_id: this.vish_id,
      vsli_id: (this.creating ? 0 : this.dataTable.selId),
      vsli_seq: (this.creating ? "" : document.getElementById(`inp_${this.tabsheet}_seq`).value),
      vsli_text: document.getElementById(`inp_${this.tabsheet}_text`).value.trim(),
    };
    formData.append("vsli", JSON.stringify(vsli));
    const url = `/w/extensions/VideoShorts/src/util.php?func=vliSubmit&sess_key=${appLogic.session_key}&creating=${+this.creating}`;
    fetch(url, {
      method: 'POST',
      body: formData})
    .then((resp) => resp.json())
    .then((data) => {
      if (data.error != "") {
        document.getElementById(`div_vsli_${this.tabsheet}_fail`).textContent = data.error;
      } else {
        this.hideEdit();
        this.getLines(data.vsli_seq);
      }
    })
    .catch(function(error) {
    });
  }
  
  vliValid() {
    document.getElementById(`div_vsli_${this.tabsheet}_fail`).textContent = "";
    if (document.getElementById(`inp_${this.tabsheet}_text`).value.trim() > "") return true;
    else {
      document.getElementById(`div_vsli_${this.tabsheet}_fail`).textContent = "Text is mandatory";
      return false;
    }
  }
  
  showEdit() {
    document.getElementById(`div_vsli_${this.tabsheet}_edit`).style.display = "block";
    document.getElementById(`inp_${this.tabsheet}_text`).focus();
  }

  hideEdit() {
    document.getElementById(`div_vsli_${this.tabsheet}_edit`).style.display = "none";
    document.getElementById(`div_vsli_${this.tabsheet}_fail`).textContent = "";
  }

  vliMoveDown() {
    if (this.vish_id == 0) return;
    let vsli_id = this.dataTable.selId;
    if (!vsli_id) return;
    let vsli = this.data.find((rec) => { return rec.vsli_id == vsli_id });
    let vsli_seq = parseInt(vsli.vsli_seq);
    if (vsli_seq == this.data.length) return;
    this.vliSwap(vsli_seq,vsli_seq+1);
  }

  vliMoveUp() {
    if (this.vish_id == 0) return;
    let vsli_id = this.dataTable.selId;
    if (!vsli_id) return;
    let vsli = this.data.find((rec) => { return rec.vsli_id == vsli_id });
    let vsli_seq = parseInt(vsli.vsli_seq);
    if (vsli_seq == 1) return;
    this.vliSwap(vsli_seq,vsli_seq-1);
  }
  
  vliSwap(seqA,seqB) {
    const url = `/w/extensions/VideoShorts/src/util.php?func=vliSwap&sess_key=${appLogic.session_key}&vish_id=${this.vish_id}&seqA=${seqA}&seqB=${seqB}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        if (data.error == "") this.getLines(seqB);
      })
      .catch(function(error) {});
  }
}
