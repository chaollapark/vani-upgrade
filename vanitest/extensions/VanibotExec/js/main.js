const PAGESAVE_INTERVAL = 1000;

function start() {
    var pageEditLogic = new PageEditLogic();
    
    pageEditLogic.start();
}

class PageEditLogic {
  constructor () {}
  
  async start() {
      let botID = document.getElementById('txtBotID').value;
      
      this.inputDir = `/bot_output/${botID}`;
      this.indexUrl = `${this.inputDir}/index.txt`;
      
      this.divOutput = document.getElementById('divOutput');
      this.summary = document.getElementById('txtSummary').value;
      
      this.index = await this.getIndexPage(this.indexUrl);
      
      await this.savePages();
  }
  
  async getIndexPage(url) {
      return new Promise((resolve, reject) => {
          fetch(url)
          .then(response => response.json())
          .then(data => resolve(data))
          .catch(error => {
              alert("Cannot find index file");
              reject();
          });
      });
  }
  
  async savePages() {
      let indexPos = 0;
      let lastIndexPos = this.index.length - 1;
      
      const doEntry = () => setTimeout(async () => {
          let entry = this.index[indexPos];
          
          this.savePage(entry.id, entry.title)
          .then(() => {
              if (indexPos++ < lastIndexPos) {
                  doEntry();
              }
              else {
                  this.sendOutput("Complete");
              }
          })
          .catch(() => {});
      }, PAGESAVE_INTERVAL);
      
      doEntry(0);
  }
  
  async savePage(id, title) {
      let url = `${this.inputDir}/${id}.txt`;
      
      return new Promise((resolve, reject) => {
          fetch(url)
          .then(response => response.text())
          .then(async (text) => {
              await this.createPage(title, text);
              
              this.sendOutput(`Saved page: ${title}`);
              
              resolve();
          })
          .catch(error => {
              const errorStr = `Cannot find ${url} for title: ${title}`;
              
              alert(errorStr);
              this.sendOutput(errorStr);
              
              reject();
          });
      });
  }
  
  sendOutput(text) {
      let textNode = document.createTextNode(text);
      let brElement = document.createElement('br');
      
      this.divOutput.appendChild(textNode);
      this.divOutput.appendChild(brElement);
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
    params.append("summary", this.summary); /* = revision.rev_comment */
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

  async getToken() {
    let token;
    const url = "/w/api.php?action=query&meta=tokens&format=json";
    await fetch(url)
      .then(response => response.json())
      .then(data => { token = data.query.tokens.csrftoken })
      .catch(error => {});
    return token;
  }
}
