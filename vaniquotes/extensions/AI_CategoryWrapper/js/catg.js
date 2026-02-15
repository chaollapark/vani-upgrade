class CtgLogic {
  constructor () {
    this.name = "categories";
    this.prefix = "cat_";
    this.idfld = "cat_id";
    this.data = [];
    this.dataTable = null;
    this.offset = 0;
    this.tot_records = 0;
    this.tot_pages = 0;
    this.cur_page = 0;
    this.sIndex = 1;
    this.columns = [
      {name:"cat_id", label:"Id", width:"75px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"cat_title", label:"Category Name", width:"550px", sort:true, dir:0, elem:null, type:"lnk", cls:"no-break-word"},
      {name:"cat_pages", label:"Pages", width:"75px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"cat_subcats", label:"SubCats", width:"85px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"cat_include", label:"Include", width:"75px", sort:false, dir:0, elem:null, type:"tgl", cls:"single_char"},
    ];
  }

  getCategories(reset) {
    if (reset) this.resetNavValues();
    let div = document.getElementById(`div_tbl_${this.name}`);
    div.textContent = "Retrieving categories ...";
    let limit = sel_rpp.value;
    let params = new FormData();
    params.append('petl_name', sel_petl.value);
    params.append('filter', inp_filt_catg.value);
    params.append('match_type', sel_mtyp.value);
    params.append('pages_from', inp_pages_from.value);
    params.append('pages_until', inp_pages_until.value);
    params.append('sort_fld', this.columns[this.sIndex].name);
    params.append('sort_dir', this.columns[this.sIndex].dir);
    params.append('offset', this.offset);
    params.append('limit', limit);
    params.append('tot_records', this.tot_records);
    params.append('filt_include', sel_include.value);
    const url = "/w/extensions/AI_CategoryWrapper/src/util.php?func=getCategories";
    fetch(url, {method:"POST", body:params})
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data.categories;
        this.tot_records = data.tot_records;
        this.tot_pages = Math.ceil(this.tot_records/limit);
        if (this.tot_records && this.cur_page == 0) this.cur_page = 1;
        this.dspNavValues();
        this.dataTable = new DataTable(this,div);
      })
      .catch(function(error) {});
  }
  
  async genWrapRecords() {
    let div = document.getElementById(`div_tbl_${this.name}`);
    div.textContent = "Generating Wrapper Records ...";
    const url = "/w/extensions/AI_CategoryWrapper/src/util.php?func=genWrapRecords";
    await fetch(url);
  }
  
  async updateOneInclude(cat_id,include) {
    let isAllowed = false;
    let params = new FormData();
    params.append('catg_id', cat_id);
    params.append('catg_include', include);
    const url = "/w/extensions/AI_CategoryWrapper/src/util.php?func=updateOneInclude";
    await fetch(url, {method:"POST", body:params})
      .then(response => response.text())
      .then(result => isAllowed = result.trim() === '1');
    return isAllowed;
  }
  
  async includeSelection() {
    if (!confirm(`Are you sure you want to include these ${this.tot_records} categories?`)) return;
    await this.updateManyInclude('Y');
  }
  
  async excludeSelection() {
    if (!confirm(`Are you sure you want to exclude these ${this.tot_records} categories?`)) return;
    await this.updateManyInclude('N');
  }
  
  async updateManyInclude(catg_include) {
    let isAllowed = false;
    let div = document.getElementById(`div_tbl_${this.name}`);
    div.textContent = "Updating wrapper include values ...";
    let params = new FormData();
    params.append('filter', inp_filt_catg.value);
    params.append('match_type', sel_mtyp.value);
    params.append('pages_from', inp_pages_from.value);
    params.append('pages_until', inp_pages_until.value);
    params.append('filt_include', sel_include.value);
    params.append('catg_include', catg_include);
    const url = "/w/extensions/AI_CategoryWrapper/src/util.php?func=updateManyInclude";
    await fetch(url, {method:"POST", body:params})
      .then(response => response.text())
      .then(result => isAllowed = result.trim() === '1');
    if (!isAllowed) alert("You do not have permission for this action");
    this.getCategories(true);
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
    this.getCategories(false);
  }
  
  nextPage() {
    if (this.cur_page >= this.tot_pages) return;
    this.cur_page = this.cur_page + 1;
    this.offset = (this.cur_page - 1) * sel_rpp.value;
    this.getCategories(false);
  }
  
  firstPage() {
    if (this.cur_page <= 1) return;
    this.cur_page = 1;
    this.getCategories(false);
  }
  
  lastPage() {
    if (this.cur_page >= this.tot_pages) return;
    this.cur_page = this.tot_pages;
    this.offset = (this.cur_page - 1) * sel_rpp.value;
    this.getCategories(false);
  }
  
}
