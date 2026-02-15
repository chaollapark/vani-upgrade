class TrnLogic extends VshLogic {
  constructor () {
    super("translation");
    this.vli = new TliLogic();
  }
  
  async drawControl() {
    let htmlElems = [
      {className:"HtmlDiv", cls:"headerblock", children:[
         {className:"HtmlLabel", cls:"headerunit", text:"Language:"}
       ]},
      {className:"HtmlDiv", cls:"headerblock", children:[
         {className:"HtmlSelect", id:"sel_translation_lang", cls:"headerunit", onchange:()=>this.syncLanguage(), populate:(obj)=>appLogic.getLanguages(obj)}
       ]}
    ];
    await appLogic.renderHtml(div_control_translation,htmlElems);
  }
  
  syncLanguage() {
    this.vli.vish_id = 0;
    this.lang_code = sel_translation_lang.value;
    div_tbl_translation_lines.innerHTML = "";
    ifr_translation_video.src = "";
    this.getVideos("");
  }

  syncTransCode() {
    let vish_code = sel_translation_code.value;
    if (!vish_code) return; /* TODO: test */
    let vish = vshLogic.data.find((rec) => { return rec.vish_code == vish_code });
    inp_translation_title_E.value = vish.vish_title;
    inp_translation_ref_E.value = vish.vish_ref;
    inp_translation_url.value = vish.vish_url;
    inp_translation_date_E.value = vish.vish_date;
    inp_translation_date.value = vish.vish_date;
  }

  async vshInsert() {
    if (this.lang_code == "0") return;
    this.showEdit();
    sel_translation_code.innerHTML = "";
    await appLogic.getTransCodes(sel_translation_code,this.lang_code);
    inp_translation_title_E.value = "";
    inp_translation_title.value = "";
    inp_translation_ref_E.value = "";
    inp_translation_ref.value = "";
    inp_translation_url.value = "";
    inp_translation_date_E.value = "";
    inp_translation_date.value = "";
    this.syncTransCode();
    sel_translation_code.focus();
    but_vish_translation_submit.textContent = "Insert";
    this.creating = true;
  }
  
  vshEdit() {
    let vish_id = this.dataTable.selId;
    if (!vish_id) return;
    this.showEdit();
    sel_translation_code.innerHTML = "";
    let vishT = this.data.find((rec) => { return rec.vish_id == vish_id });
    let vishE = vshLogic.data.find((rec) => { return rec.vish_code == vishT.vish_code });
    
    let instance = new HtmlOption({value:vishT.vish_code, text:vishT.vish_code});
    sel_translation_code.appendChild(instance.obj);
    sel_translation_code.value = vishT.vish_code;
    
    inp_translation_title_E.value = vishE.vish_title;
    inp_translation_title.value = vishT.vish_title;
    inp_translation_ref_E.value = vishE.vish_ref;
    inp_translation_ref.value = vishT.vish_ref;
    inp_translation_url.value = vishT.vish_url;
    inp_translation_date_E.value = vishE.vish_date;
    inp_translation_date.value = vishT.vish_date;
    but_vish_translation_submit.textContent = "Update";
    this.creating = false;
  }
  
  vshValid() {
    div_vish_translation_fail.textContent = "";
    return true;
  }

  showEdit() {
    div_vish_translation_edit.style.display = "block";
    inp_translation_title.focus();
  }
  
  async drawModalWindows() {
    let htmlElems = [
     {className:"HtmlDiv", id:`div_vish_translation_edit`, cls:"modal-wrapper", children:[
        {className:"HtmlDiv", cls:"modal-content animate", style:{width: "45em"}, children:[
           {className:"HtmlSpan", cls:"modal-close", onclick:()=>this.hideEdit()},
           {className:"HtmlDiv", cls:"modal-block", children:[
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Code", style:{"font-weight":"bold"}},
                 {className:"HtmlSelect", id:"sel_translation_code", cls:"edit", onchange:()=>this.syncTransCode()}
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Title", style:{"font-weight":"bold"}},
                 {className:"HtmlDiv", cls:"transpair", children:[
                    {className:"HtmlInput", id:`inp_translation_title_E`, type:"text", cls:"edit w600", maxlength:"75", readonly:true, style:{color:"black"}},
                    {className:"HtmlInput", id:`inp_translation_title`, type:"text", cls:"edit w600", maxlength:"75"},
                  ]},
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Reference", style:{"font-weight":"bold"}},
                 {className:"HtmlDiv", cls:"transpair", children:[
                    {className:"HtmlInput", id:`inp_translation_ref_E`, type:"text", cls:"edit w400", maxlength:"50", readonly:true, style:{color:"black"}},
                    {className:"HtmlInput", id:`inp_translation_ref`, type:"text", cls:"edit w400", maxlength:"50"}
                  ]},
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"URL", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_translation_url`, type:"text", cls:"edit w400", maxlength:"50", readonly:true, style:{color:"black"}}
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Date", style:{"font-weight":"bold"}},
                 {className:"HtmlDiv", cls:"transpair", children:[
                    {className:"HtmlInput", id:`inp_translation_date_E`, type:"text", cls:"edit w100", maxlength:"10", readonly:true, style:{color:"black"}},
                    {className:"HtmlInput", id:`inp_translation_date`, type:"text", cls:"edit w100", maxlength:"10"}
                  ]},
              ]},
              {className:"HtmlButton", id:`but_vish_translation_submit`, cls:"modal-button", text:"Submit", onclick:()=>this.vshSubmit(this.lang_code)},
              {className:"HtmlButton", cls:"modal-button", text:"Cancel", style:{float: "right"}, onclick:()=>this.hideEdit()},
              {className:"HtmlDiv", id:`div_vish_translation_fail`, cls:"modal-error"}
            ]}
         ]}
      ]},
     {className:"HtmlDiv", id:`div_vsli_translation_edit`, cls:"modal-wrapper", children:[
        {className:"HtmlDiv", cls:"modal-content animate", style:{width: "50em"}, children:[
           {className:"HtmlSpan", cls:"modal-close", onclick:()=>this.vli.hideEdit()},
           {className:"HtmlDiv", cls:"modal-block", children:[
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Seq", style:{"font-weight":"bold"}},
                 {className:"HtmlInput", id:`inp_translation_seq`, type:"text", cls:"edit w50", maxlength:"2", readonly:true}
              ]},
              {className:"HtmlDiv", children:[
                 {className:"HtmlLabel", cls:"edit", text:"Text", style:{"font-weight":"bold"}},
                 {className:"HtmlDiv", cls:"transpair", children:[
                    {className:"HtmlInput", id:`inp_translation_text_E`, type:"text", cls:"edit w600", maxlength:"75", readonly:true, style:{color:"black"}},
                    {className:"HtmlInput", id:`inp_translation_text`, type:"text", cls:"edit w600", maxlength:"75"}
                  ]},
                 
              ]},
              {className:"HtmlButton", id:`but_vsli_translation_submit`, cls:"modal-button", text:"Submit", onclick:()=>this.vli.vliSubmit()},
              {className:"HtmlButton", cls:"modal-button", text:"Cancel", style:{float: "right"}, onclick:()=>this.vli.hideEdit()},
              {className:"HtmlDiv", id:`div_vsli_translation_fail`, cls:"modal-error"}
            ]}
         ]}
      ]}
    ];
    await appLogic.renderHtml(document.body,htmlElems);
  }
}

class TliLogic extends VliLogic {
  constructor () {
    super("translation");
  }
  
  async vliEdit(master) {
    if (this.vish_id == 0) return;
    let vsli_id = this.dataTable.selId;
    if (!vsli_id) return;
    this.showEdit();
    let vish = master.data.find((rec) => { return rec.vish_id == this.vish_id });
    let vsli = this.data.find((rec) => { return rec.vsli_id == vsli_id });
    inp_translation_seq.value = vsli.vsli_seq;
    inp_translation_text.value = vsli.vsli_text;
    inp_translation_text_E.value = await this.getEnglish(vish.vish_code,vsli.vsli_seq);
    but_vsli_translation_submit.textContent = "Update";
    this.creating = false;
  }

  async getEnglish(vish_code,vsli_seq) {
    let english = "";
    const url = `/w/extensions/VideoShorts/src/util.php?func=getEnglish&vish_code=${vish_code}&vsli_seq=${vsli_seq}`;
    await fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        english = data.english; 
      })
      .catch(function(error) {});
    return english;
  }
}
