sync_but_search();

var modal = document.getElementById("mspu_div_wrapper");
var span = document.getElementById("mspu_spn_close");

span.onclick = function() {
  modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

function open_modal () {
  var ori_search = document.getElementById("ori_search");
  var inp_search = document.getElementById("mspu_txt_input");
  inp_search.value = ori_search.value;
  modal.style.display = "block";
  inp_search.focus();
  return false;
}

function sync_but_search () {
  rg_buttons = document.getElementsByName("tab");
  for(var b = 0; b < rg_buttons.length; b++)
  {
    if (rg_buttons[b].checked) {
      var selector = 'label[for=' + rg_buttons[b].id + ']';
      var label = document.querySelector(selector);
      var txt = label.innerHTML;
    }
  }
  document.getElementById("mspu_but_submit").value = "Search " + txt;
}
