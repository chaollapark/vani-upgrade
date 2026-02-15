class VqhLogic {
  constructor () {
    this.name = "vqhistory";
    this.prefix = "vqhi_";
    this.idfld = "vqhi_id";
    this.data = [];
    this.dataTable = null;
    this.columns = [
      {name:"vqhi_id", label:"Id", width:"75px", sort:true, dir:0, elem:null, type:"cel", cls:"number_cel"},
      {name:"vqhi_time", label:"Time", width:"150px", sort:true, dir:1, elem:null, type:"cel", cls:""},
      {name:"vqhi_method", label:"Method", width:"75px", sort:true, dir:0, elem:null, type:"cel", cls:""}
    ];
  }

  getVqHistory() {
    const url = "/w/extensions/QuotesAdmin/src/util.php?func=getVqHistory";
    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        this.data = data; 
        this.dataTable = new DataTable(this,1);
      })
      .catch(function(error) {});
  }
  
  refresh() {}
}
