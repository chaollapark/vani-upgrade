class TRPRMaster {
  constructor () {
    this.prop_id = 1;
    this.name = "trpr_master";
    this.prefix = "trprm_";
    this.idfld = "trpr_id";
    this.selfld = "trpr_select";
//    this.varfld = "links_col";
    this.chkFunc = null;
    this.selFunc = null;
    this.data = [];
    this.dataTable = null;
    this.columns = [
      {name:"vers_ref", label:"Verse", width:"150px", sort:true, dir:0, elem:null, type:"cel", cls:""},
      {name:"trpr_seq", label:"Seq", width:"50px", sort:false, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"tran_text", label:"Translation", width:"500px", sort:false, dir:0, elem:null, type:"cel", cls:"transtext"},
      {name:"trpr_from", label:"From", width:"50px", sort:false, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"trpr_until", label:"Until", width:"50px", sort:false, dir:0, elem:null, type:"cel", cls:"number_cel"},
//      {name:"vquo_pages", label:"Pages", width:"100px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
//      {name:"vquo_links", label:"Quotes", width:"100px", sort:true, dir:0, elem:null, type:"var", cls:"number_cel"},
      {name:"trpr_select", label:"S", width:"30px", sort:true, dir:0, elem:null, type:"chb", cls:""}
    ];
  }

  getTRPR() {
    let prop_id = sel_prop.value;
    const url = `/w/extensions/TranPropAdmin/src/util.php?func=getTRPRmaster&prop_id=${prop_id}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data; 
        this.dataTable = new DataTable(this);
      })
      .catch(function(error) {});
  }
  
  addProperty() {
    let tran_id = trprDetail.tran_id;
    let prop_id = sel_prop_detail.value;
    const url = `/w/extensions/TranPropAdmin/src/util.php?func=addProperty&tran_id=${tran_id}&prop_id=${prop_id}`;
    fetch(url)
      .then(() => {
        trprDetail.getTRPR(tran_id);
      })
      .catch(function(error) {});
  }
  
  delProperties() {
    if (!confirm("Are you sure you want to delete the selected properties?")) return;
    let arr_seq = [];
    trprDetail.data.forEach((rec) => {
      if (!rec[trprDetail.selfld]) return;
      arr_seq.push(rec["trpr_seq"]);
    });
    let tran_id = trprDetail.tran_id;
    let list_seq = `(${arr_seq.join(",")})`;
    const url = `/w/extensions/TranPropAdmin/src/util.php?func=delProperties&tran_id=${tran_id}&list_seq=${list_seq}`;
    fetch(url)
      .then(() => {
        trprDetail.getTRPR(tran_id);
      })
      .catch(function(error) {});
  }
}

class TRPRDetail {
  constructor () {
    this.tran_id = 0;
    this.name = "trpr_detail";
    this.prefix = "trprd_";
    this.idfld = "trpr_id";
    this.selfld = "trpr_select";
//    this.varfld = "links_col";
    this.chkFunc = null;
    this.selFunc = null;
    this.data = [];
    this.dataTable = null;
    this.columns = [
      {name:"prop_desc", label:"Property", width:"150px", sort:false, dir:0, elem:null, type:"cel", cls:""},
      {name:"trpr_seq", label:"Seq", width:"50px", sort:false, dir:0, elem:null, type:"cel", cls:"number_cel"},
//      {name:"vquo_pages", label:"Pages", width:"100px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
//      {name:"vquo_links", label:"Quotes", width:"100px", sort:true, dir:0, elem:null, type:"var", cls:"number_cel"},
      {name:"trpr_select", label:"S", width:"30px", sort:false, dir:0, elem:null, type:"chb", cls:""}
    ];
  }

  getTRPR(tran_id) {
    this.tran_id = tran_id;
    const url = `/w/extensions/TranPropAdmin/src/util.php?func=getTRPRdetail&tran_id=${tran_id}`;
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data; 
        this.dataTable = new DataTable(this,1);
      })
      .catch(function(error) {});
  }
}
