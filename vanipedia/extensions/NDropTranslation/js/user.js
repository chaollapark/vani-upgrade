class UserLogic {
  constructor () {
    this.userName = "";
    this.getUserInfo();
  }
  
  getUserInfo () {
    const url = "/w/api.php?action=query&format=json&meta=userinfo";
    fetch(url)
      .then(response => response.json())
      .then(data => {
        let user;
        if (typeof(data.query.userinfo.anon) != "undefined") user = "";
        else user = data.query.userinfo.name;
        this.processUserInfo(user);
      })
      .catch(error => {});
  }
  
  processUserInfo (user) {
    this.userName = user;
    if (user == "") {
      div_uname_pword.style.display = "block";
      div_current_user.style.display = "none";
    } else { 
      spn_login_status.innerHTML = `You are logged in as ${this.userName} `;
      div_uname_pword.style.display = "none";
      div_current_user.style.display = "block";
    }
  }
  
  async login () {
    const token = await this.getLoginToken();
    const url = "/w/api.php?format=json";
    let params = new FormData();
    params.append("action", "clientlogin");
    params.append("logintoken", token);
    params.append("loginreturnurl", document.location.href);
    params.append("username", inp_username.value);
    params.append("password", inp_password.value);
    params.append("rememberMe", "1");
    fetch(url, {method:"POST", body:params})
      .then(response => response.json())
      .then(data => {
        if (data.clientlogin.status == "PASS") {
          spn_login_fail.style.display = "none";
          this.processUserInfo(data.clientlogin.username);
        } else {
          spn_login_fail.innerText = "Authentication failed";
          spn_login_fail.style.display = "block";
        }
      })
      .catch(error => {});
  }

  logout () {
    const url = "/w/api.php?action=logout";
    fetch(url).then(() => this.processUserInfo(""))
  }
  
  async getLoginToken() {
    let token;
    const url = "/w/api.php?action=query&meta=tokens&type=login&format=json";
    await fetch(url)
      .then(response => response.json())
      .then(data => token = data.query.tokens.logintoken)
      .catch(error => {});
    return token;
  }
}
