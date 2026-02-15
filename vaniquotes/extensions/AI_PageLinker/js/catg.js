class CtgLogic {
  constructor () {
    this.name = "pages";
    this.prefix = "sqpl_";
    this.idfld = "sqpl_idQ";
    this.data = [];
    this.dataTable = null;
    this.offset = 0;
    this.tot_records = 0;
    this.tot_pages = 0;
    this.cur_page = 0;
    this.sIndex = 0;
    this.columns = [
      {name:"vq_title", label:"Vaniquotes Page", width:"525px", sort:true, dir:0, elem:null, type:"lnk_Q", cls:"no-break-word"},
      {name:"vs_title", label:"Vanisource Page", width:"525px", sort:true, dir:0, elem:null, type:"lnk_S", cls:"no-break-word"},
      {name:"sqpl_include", label:"Include", width:"75px", sort:false, dir:0, elem:null, type:"tgl", cls:"single_char"},
    ];
  }

  getPages(reset) {
    if (reset) this.resetNavValues();
    let div = document.getElementById(`div_tbl_${this.name}`);
    div.textContent = "Retrieving Page Links ...";
    let limit = sel_rpp.value;
    let params = new FormData();
    params.append('petl_name', sel_petl.value);
    params.append('filter', inp_filt_catg.value);
    params.append('match_type', sel_mtyp.value);
    params.append('sort_fld', this.columns[this.sIndex].name);
    params.append('sort_dir', this.columns[this.sIndex].dir);
    params.append('offset', this.offset);
    params.append('limit', limit);
    params.append('tot_records', this.tot_records);
    params.append('filt_include', sel_include.value);
    const url = "/w/extensions/AI_PageLinker/src/util.php?func=getPages";
    fetch(url, {method:"POST", body:params})
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data.pages;
        this.tot_records = data.tot_records;
        this.tot_pages = Math.ceil(this.tot_records/limit);
        if (this.tot_records && this.cur_page == 0) this.cur_page = 1;
        this.dspNavValues();
        this.dataTable = new DataTable(this,div);
      })
      .catch(function(error) {});
  }
  
  async updPageLinks_1() {
    let div = document.getElementById(`div_tbl_${this.name}`);
    div.textContent = "Updating Single Quote Page Links 1 ...";
    const url = "/w/extensions/AI_PageLinker/src/util.php?func=updPageLinks_1";
    await fetch(url);
  }
  
  async updPageLinks_2() {
    let div = document.getElementById(`div_tbl_${this.name}`);
    div.textContent = "Updating Single Quote Page Links 2 ...";
    const url = "/w/extensions/AI_PageLinker/src/util.php?func=updPageLinks_2";
    await fetch(url);
  }
  
  async updateOneInclude(sqpl_idQ,include) {
    let isAllowed = false;
    let params = new FormData();
    params.append('sqpl_idQ', sqpl_idQ);
    params.append('sqpl_include', include);
    const url = "/w/extensions/AI_PageLinker/src/util.php?func=updateOneInclude";
    await fetch(url, {method:"POST", body:params})
      .then(response => response.text())
      .then(result => isAllowed = result.trim() === '1');
    return isAllowed;
  }
  
  async includeSelection() {
    if (!confirm(`Are you sure you want to include these ${this.tot_records} pages?`)) return;
    await this.updateManyInclude('Y');
  }
  
  async excludeSelection() {
    if (!confirm(`Are you sure you want to exclude these ${this.tot_records} pages?`)) return;
    await this.updateManyInclude('N');
  }
  
  async updateManyInclude(sqpl_include) {
    let isAllowed = false;
    let div = document.getElementById(`div_tbl_${this.name}`);
    div.textContent = "Updating page include values ...";
    let params = new FormData();
    params.append('filter', inp_filt_catg.value);
    params.append('match_type', sel_mtyp.value);
    params.append('filt_include', sel_include.value);
    params.append('sqpl_include', sqpl_include);
    const url = "/w/extensions/AI_PageLinker/src/util.php?func=updateManyInclude";
    await fetch(url, {method:"POST", body:params})
      .then(response => response.text())
      .then(result => isAllowed = result.trim() === '1');
    if (!isAllowed) alert("You do not have permission for this action");
    this.getPages(true);
  }
  

  dspNavValues() {
    div_tot_records.textContent = this.tot_records;
    div_tot_pages.textContent = this.tot_pages;
    div_cur_page.textContent = this.cur_page;
  }
  
  resetNavValues() {
    this.offset = 0;
    this.tot_records = 0;
    this.tot_pages = 0;
    this.cur_page = 0;
  }
  
  prevPage() {
    if (this.cur_page <= 1) return;
    this.cur_page = this.cur_page - 1;
    this.offset = (this.cur_page - 1) * sel_rpp.value;
    this.getPages(false);
  }
  
  nextPage() {
    if (this.cur_page >= this.tot_pages) return;
    this.cur_page = this.cur_page + 1;
    this.offset = (this.cur_page - 1) * sel_rpp.value;
    this.getPages(false);
  }
  
  firstPage() {
    if (this.cur_page <= 1) return;
    this.cur_page = 1;
    this.getPages(false);
  }
  
  lastPage() {
    if (this.cur_page >= this.tot_pages) return;
    this.cur_page = this.tot_pages;
    this.offset = (this.cur_page - 1) * sel_rpp.value;
    this.getPages(false);
  }
  
}
