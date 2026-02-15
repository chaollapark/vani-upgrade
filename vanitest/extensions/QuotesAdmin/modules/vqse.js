class VqsLogic {
  constructor () {
    this.name = "vqsections";
    this.prefix = "vquo_";
    this.idfld = "vquo_id";
    this.selfld = "vquo_select";
    this.varfld = "links_col";
    this.selFunc = this.syncRelPages;
    this.relPages = 0;
    this.data = [];
    this.dataTable = null;
    this.columns = [
      {name:"vquo_seq", label:"Seq", width:"50px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"vquo_code", label:"Code", width:"100px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vquo_desc", label:"Description", width:"300px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"vquo_pages", label:"Pages", width:"100px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"vquo_links", label:"Quotes", width:"100px", sort:true, dir:0, elem:null, type:"var", cls:"number_cel"},
      {name:"vquo_select", label:"S", width:"30px", sort:true, dir:0, elem:null, type:"chb", cls:""}
    ];
  }

  getVqSections() {
    const url = "/w/extensions/QuotesAdmin/src/util.php?func=getVqSections";
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data; 
        this.dataTable = new DataTable(this);
      })
      .catch(function(error) {});
  }
  
  countQuotes() {
    if (!confirm(`Are you sure you want to count quotes for ${this.relPages} pages?`)) return;
    
    /**/
    let sections = {};
    this.data.forEach(vquo => {
      if (vquo.vquo_select) {
        sections[vquo.vquo_code] = 0;
        vquo.links_col.classList.add("focus_cel");
        vquo.links_col.textContent = 0;
      }
    });
    
    /**/
    let url = `/w/extensions/QuotesAdmin/src/util.php?func=countQuotes&sections=${JSON.stringify(sections)}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.data.forEach(vquo => {
          if (vquo.vquo_select) {
            vquo.vquo_links = data.sections[vquo.vquo_code];
            vquo.links_col.classList.remove("focus_cel");
            vquo.links_col.textContent = vquo.vquo_links;
          }
        });
      })
      .catch(error => {});
  }
  
  syncRelPages() {
    let pages = 0;
    this.data.forEach((v)=>{ if (v.vquo_select) pages += v.vquo_pages });
    div_vqs_related.textContent = `Related pages: ${pages}`;
    this.relPages = pages;
  }
}
