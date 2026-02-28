class HierArchy {
  constructor () {
  }
  
  displayHits() {
    let book_id, part_id, chap_id, level, data, prefix = "", postfix = "", sel;

    div_syno_right.innerHTML = "";
    book_id = parseInt(sel_book_syno.value);
    part_id = parseInt(sel_part_syno.value);
    chap_id = parseInt(sel_chap_syno.value);
    
    if (chap_id) return;
    else if (part_id) {
      level = "chap"; data = g_chaps; prefix = "Chapter "; sel = sel_chap_syno;
    } else if (book_id) {
      switch (book_id) {
        case 1: level = "chap"; data = g_chaps; prefix = "Chapter "; sel = sel_chap_syno; break;
        case 2: level = "part"; data = g_parts; prefix = "Canto "; sel = sel_part_syno; break;
        case 3: level = "part"; data = g_parts; postfix = " Lila"; sel = sel_part_syno; break;
        case 4: return;
        case 5: return;
      }
    } else {
      level = "book"; data = g_books; sel = sel_book_syno;
    }
    
    let hits = g_search_data["syno"].hierarchy[level];
    Object.keys(hits).forEach(key => {
      let amount = hits[key];
      let name = data[key].name;
      let div = create_div("", "hitdiv", null, []);
      div.textContent = `${prefix}${name}${postfix} (${amount})`;
      div.onclick = () => this.stepDown(key,sel);
      div.style.cursor = "pointer";
      div_syno_right.appendChild(div);
    });

  }
 
  stepDown(key,sel) {
    sel.value = key;
    sel.onchange();
    search_syno();
  }
 
}