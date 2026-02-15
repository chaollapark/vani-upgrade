var appLogic, ndropLogic, setupLogic, userLogic;

function initPage(parentId) {
  appLogic = new AppLogic();
  ndropLogic = new NdropLogic();
  setupLogic = new SetupLogic();
  userLogic = new UserLogic();
  appLogic.renderHtml(document.getElementById(parentId),htmlElems);
  appLogic.selectTab("english");
  setupLogic.selectTab("su_general");
}

class AppLogic {
  constructor () {
    this.langCode = "0";
    this.langName = "";
    this.activeTab = [null,null];
  }

  renderHtml(parent,elems) {
    elems.forEach(elem => {
      let instance = new htmlClasses[elem.className](elem);
      parent.appendChild(instance.obj);
      if ("populate" in elem) elem.populate(instance.obj);
      if ("children" in elem) this.renderHtml(instance.obj,elem.children);
    });
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

  listYearLoca(parent,type) {
    const url = `/w/extensions/NDropTranslation/src/util.php?func=listYearLoca&type=${type}`;
    fetch(url)
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

  listLanguages(parent) {
    const url = "/w/extensions/NDropTranslation/src/util.php?func=listLanguages";
    fetch(url)
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
  
  syncLanguage () { /* todo */
    let lang_code = this.langCode;
    this.langCode = sel_language.value;  
    this.langName = sel_language.options[sel_language.selectedIndex].text;
    if (ndropLogic.english.id) ndropLogic.getNdropData(ndropLogic.english.id,true);
    if (chb_filt_trans.checked) ndropLogic.listNDrops(div_ndrop_select);
    lab_filt_trans.textContent = `not translated into ${this.langName}`;
    if ((this.langCode == "0") || (lang_code == "0")) {
      if (this.langCode == "0")  {
        div_filt_trans.style.display = "none";
        div_setup_content.style.display = "none"; 
        return;
      }
      div_filt_trans.style.display = "block";
      div_setup_content.style.display = "block";
    }
    setupLogic.getSetupData(); 
  }
}
