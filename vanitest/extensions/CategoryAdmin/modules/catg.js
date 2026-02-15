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
      {name:"cat_title", label:"Category Name", width:"550px", sort:true, dir:0, elem:null, type:"lnk", cls:""},
      {name:"cat_pages", label:"Pages", width:"75px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"cat_subcats", label:"SubCats", width:"85px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"}
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
    const url = "/w/extensions/CategoryAdmin/src/util.php?func=getCategories";
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
