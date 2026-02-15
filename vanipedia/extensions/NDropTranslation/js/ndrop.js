class NdropLogic {
  constructor () {
    this.english = {};
    this.translation = {};
    this.newPageId = 0;
    this.vpRoot = "/wiki/";
  }
  
  listNDrops(parent) {
    const year = sel_year.value;
    const loca = sel_loca.value;
    let lang_code = (chb_filt_trans.checked ? appLogic.langCode.toUpperCase() : "");
    let lang_name = (chb_filt_trans.checked ? appLogic.langName.replaceAll(" ","_") : "");

    div_ndrop_select.innerHTML = "Retrieving nectar drops ..."; 
    div_total.innerHTML = "";
    const url = `/w/extensions/NDropTranslation/src/util.php?func=listNDrops&year=${year}&loca=${loca}&lang_code=${lang_code}&lang_name=${lang_name}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const cls = ["odd","even"]; let idx = 0;
        div_ndrop_select.innerHTML = "";
        div_total.innerHTML = `Total: ${data.total} Nectar Drops`;
        data.titles.forEach(record => {
          let elem = {id:record.id, text:record.title, cls:`btn_drop btn_${cls[idx%2]}`, onclick:() => ndropLogic.getNdropData(record.id)};
          let instance = new HtmlDiv(elem);
          parent.appendChild(instance.obj); idx++;
        })
      })
      .catch(error => {});
  }
  
  getNdropData (page_id,trans_only=false) {
    if (!page_id) return;
    let lang_code = appLogic.langCode;
    let lang_name = appLogic.langName.replaceAll(" ","_"); /* todo: check */
    const url = `/w/extensions/NDropTranslation/src/util.php?func=getNdropData&page_id=${page_id}&lang_code=${lang_code}&lang_name=${lang_name}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.hidePreview(); this.hideCreateOk();
        if (!trans_only) {
          this.english = data.english;
          this.showNdrop(div_ndrop_orig, this.english.title, this.english.page_text);
        }  
        this.translation = data.translation;
        this.processData();
      })
      .catch(error => {});
  }
  
  showNdrop(parent,title,text) {
    const url = `/w/api.php?action=parse&prop=text&format=json&title=${title}`;
    let params = new FormData();
    params.append("text", text);
    fetch(url, {method:"POST", body:params})
      .then(response => response.json())
      .then(data => {
        parent.innerHTML = this.prvHeader(title) + data.parse.text["*"];
      })
      .catch(error => {});
  }
  
  showPreview() {
    if (!this.english.id) {
      alert("Please select a Nectar Drop first"); 
      return;
    }
    this.showNdrop(div_ndrop_tran, this.getTransTitle(false), this.getTransText());
  }
  
  hidePreview() {
    div_ndrop_tran.innerHTML = "";
  }
  
  processData () {
    this.syncTransTab();
  }
  
  syncTransTab() {
    this.syncTransExists();
    let readonly = this.translation.id;
    this.titleToTable(readonly);
    this.catgToTable(readonly);
    this.srefToTable(readonly);
    txt_nectar_orig.value = this.english.ndrop_text;
    txt_nectar_trans.value = this.translation.ndrop_text;
  }

  titleToTable(readonly) {
    let instance = new HtmlInput({type:"text", id:"inp_trans_title", value:this.translation.title, cls:"translation width_100", size:"96", readonly});
    let inp = instance.obj;
    instance = new HtmlTable({border:1, rows:[[this.english.title],[inp]]});
    let tbl = instance.obj;
    div_ndrop_title.innerHTML = "";
    div_ndrop_title.appendChild(tbl);
  }

  catgToTable(readonly) {
    let records = []; let instance = null;
    this.english.categories.forEach((catg,idx) => {
      let cls = "translation width_100 " + (idx === 0 ? "NDSP" : "ND");
      instance = new HtmlInput({type:"text", id:`inp_catg_${idx + 1}`, value:this.translation.categories[idx], cls, size:"64", readonly});
      records.push([catg, instance.obj]);
    });
    instance = new HtmlTable({border:1, rows:records});
    div_categories.innerHTML = "";
    div_categories.appendChild(instance.obj);
  }
  
  srefToTable(readonly) {
    let instance = new HtmlInput({type:"text", id:"inp_source_href", value:this.translation.references[0], cls:"translation width_100", size:"64", readonly:true});
    let inp_source_href = instance.obj;
    instance = new HtmlInput({type:"text", id:"inp_source_text", value:this.translation.references[1], cls:"translation width_100", size:"64", readonly});
    let inp_source_text = instance.obj;
    
    instance = new HtmlTable({border:1, rows:[[this.english.references[0], inp_source_href],[this.english.references[1], inp_source_text]]});
    let tbl = instance.obj;
    div_reference.innerHTML = "";
    div_reference.appendChild(tbl);
  }
  
  syncTransExists () {
    if (this.translation.id) {
      div_trans_warning.textContent = `Warning: this is an existing ${appLogic.langName} translation!`;
      div_trans_warning.style.display = "inline-block";
      btn_create_ndrop.textContent = "Update Nectar Drop";
      nd_success.textContent = "Nectar Drop successfully updated: ";
    }
    else {
      div_trans_warning.style.display = "none";
      btn_create_ndrop.textContent = "Create Nectar Drop";
      nd_success.textContent = "Nectar Drop successfully created: ";
    }
  }

  getTransText() {
    let text = "";
    let txt_ndsp = document.getElementsByClassName("NDSP")[0].value;
    text += `[[Category:${txt_ndsp}]]\n`;

    let cls_nd = document.getElementsByClassName("ND");
    for (let i = 0; i < cls_nd.length; i++) {
      text += `[[Category:${cls_nd[i].value}]]\n`;
    }

    var txt_trans = txt_nectar_trans.value;
    var src_href = inp_source_href.value;
    var src_text = inp_source_text.value;
    text += `{{Audiobox_NDrops|${txt_ndsp}|${this.english.audio_url}|${txt_trans}|${src_href}|${src_text}}}`;

    return text;
  }

  getTransTitle(uscore) {
    if (uscore) return inp_trans_title.value.replaceAll("_"," ");
    else return inp_trans_title.value;
  }
  
  async createNdrop() {
    let msg; let title; let exists; let text;
    this.hideCreateOk();
    if (!this.english.id) { alert("Please select a Nectar Drop first"); return }
    if (appLogic.langCode == "0") { alert("Please select a language first"); return }
    if (!setupLogic.complete && !this.translation.id) { alert("Please complete the setup first"); return } /* todo: check logic */
    title = this.getTransTitle(true);
    exists = await this.pageExists(title);
    if (exists) msg = "You are about to overwrite an existing Nectar Drop. Are you sure?";
    else msg = "Are you sure you want to create this Nectar Drop?";
    if (!confirm(msg)) return;
    if (!await this.addCategories()) return;
    text = this.getTransText();
    if (!await this.createPage(title,text)) return;
    if (!exists) this.registerNdcr();
    this.showCreateOk(title);
  }
  
  async addCategories() {
    let cls_ndsp = document.getElementsByClassName("NDSP");
    let catg = "Category:" + cls_ndsp[0].value;
    let text;
    if (!await this.pageExists(catg)) {
      text = `[[Category:Participating Languages - Nectar Drops from Srila Prabhupada]]\n[[Category:${appLogic.langName} Language|1]]\n`;
      if (!await this.createPage(catg,text)) return false;
    }

    // the NDSP category now becomes the text content of the ND categories
    text = `[[${catg}]]`;
    var cls_nd = document.getElementsByClassName("ND");
    for (let i = 0; i < cls_nd.length; i++) {
      catg = `Category:${cls_nd[i].value}`;
      if (!await this.pageExists(catg)) {
        if (!await this.createPage(catg,text)) return false; /* todo: double if => and */
      }
    }
    return true;
  }
  
  async pageExists(title) {
    let result = false;
    const url = `/w/api.php?action=query&format=json&titles=${title}`;
    await fetch(url)
      .then(response => response.json())
      .then(data => {
        if (typeof(data.query.pages["-1"]) == "undefined") result = true;
      })
      .catch(error => {});
    return result;
  }
  
  async createPage (title, text) {  
    let result = false;
    let token = await this.getToken();
    const url = "/w/api.php?assert=user&format=json";
    let params = new FormData();
    params.append("action", "edit");
    params.append("title", title);
    params.append("text", text);
    params.append("summary", ""); /* = revision.rev_comment */
    params.append("token", token);
    await fetch(url, {method:"POST", body:params})
      .then(response => response.json())
      .then(data => {
        if (data.error && data.error.code && data.error.code == "assertuserfailed") {
          if (div_current_user.style.display == "none") alert("You are not logged in");
          else alert("You do not have permission to create or edit pages")
        }
        else {
          this.newPageId = data.edit.pageid;
          result = true;
        }
      })
      .catch(error => {});
    return result;
  }
  
  registerNdcr() {
    const url = `/wiki/Special:NDropTrans/reg_ndcr?page_id=${this.newPageId}&user_name=${userLogic.userName}&lang_code=${appLogic.langCode}`; 
    fetch(url);
  }
  
  async getToken() {
    let token;
    const url = "/w/api.php?action=query&meta=tokens&format=json";
    await fetch(url)
      .then(response => response.json())
      .then(data => { token = data.query.tokens.csrftoken })
      .catch(error => {});
    return token;
  }
  
  showCreateOk (title) {
    href_ndrop.href = this.vpRoot + title;
    href_ndrop.textContent = title.replaceAll("_"," ");
    div_create_ok.style.display = "block";
  }
  
  hideCreateOk () {
    div_create_ok.style.display = "none";
  }

  prvHeader(title) {
    return `<h1>${title}</h1>`;
  }
}
