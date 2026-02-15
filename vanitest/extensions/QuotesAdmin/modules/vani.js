class SttLogic {
  constructor () {
    this.name = "vanis";
    this.prefix = "vani_";
    this.idfld = "vani_id";
    this.selfld = "vani_select";
    this.varfld = "links_col";
    this.selFunc = this.syncRelPages;
    this.relPages = 0;
    this.data = [];
    this.dataTable = null;
    this.columns = [
      {name:"vani_id", label:"Id", width:"50px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"vani_name", label:"Name", width:"550px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vani_tag", label:"Tag", width:"100px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vani_pages", label:"Pages", width:"100px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"vani_links", label:"Links", width:"100px", sort:true, dir:0, elem:null, type:"var", cls:"number_cel"},
      {name:"vani_select", label:"S", width:"30px", sort:true, dir:0, elem:null, type:"chb", cls:""}
    ];
  }

  getVanis() {
    const url = `/w/extensions/QuotesAdmin/src/util.php?func=getVanis&vtyp_id=${sel_vtyp.value}&filter=${inp_filt_stat.value}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data; 
        this.dataTable = new DataTable(this);
      })
      .catch(function(error) {});
  }
  
  countLinks() {
    if (!confirm(`Are you sure you want to count links for ${this.relPages} pages?`)) return;
    this.data.forEach(async vani => {
      if (vani.vani_select) {
        let row = vani.links_col.parentNode;
        row.scrollIntoView({behavior:"smooth", block:"nearest", inline:"start"});
        vani.vani_links = await this.countVaniLinks(vani.vani_id);
        vani.links_col.textContent = vani.vani_links;
      }
    });
  }
  
  async countVaniLinks(vani_id) {
    let vani_links = 0;
    let url = `/w/extensions/QuotesAdmin/src/util.php?func=countVaniLinks&vani_id=${vani_id}`;
    await fetch(url)
      .then(response => response.json())
      .then(data => vani_links = data.vani_links)
      .catch(error => {});
    return vani_links;
  }
  
  syncRelPages() {
    let pages = 0;
    this.data.forEach((v)=>{ if (v.vani_select) pages += v.vani_pages });
    div_cat_related.textContent = `Related pages: ${pages}`;
    this.relPages = pages;
  }
}
