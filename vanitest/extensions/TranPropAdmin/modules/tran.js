class TRANMaster {
  constructor () {
    this.prop_id = 1;
    this.name = "tran_master";
    this.prefix = "tran_";
    this.idfld = "tran_id";
    this.selfld = "tran_select";
//    this.varfld = "links_col";
    this.selFunc = (row) => this.selectRow(row);
    this.data = [];
    this.dataTable = null;
    this.columns = [
      {name:"vers_ref", label:"Verse", width:"150px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"tran_text", label:"Translation", width:"500px", sort:false, dir:0, elem:null, type:"cel", cls:"breakword"},
      {name:"prop_count", label:"P", width:"50px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
//      {name:"vquo_links", label:"Quotes", width:"100px", sort:true, dir:0, elem:null, type:"var", cls:"number_cel"},
      {name:"tran_select", label:"S", width:"30px", sort:true, dir:0, elem:null, type:"chb", cls:""}
    ];
  }

  getTRAN() {
    let filt = inp_filt_tran.value.trim();
    const url = `/w/extensions/TranPropAdmin/src/util.php?func=getTRANmaster&filt=${filt}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data; 
        this.dataTable = new DataTable(this);
      })
      .catch(function(error) {});
  }
  
  selectRow(row) {
    let rowid = row.id.split("_");
    trprDetail.getTRPR(rowid[1]);
  }
  
}
