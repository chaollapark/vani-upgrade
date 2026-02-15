( function ( mw ) {

    const sugLimit = 200;

    let frmPageList = document.forms.frmPageList;

    function toggleAll(e)
    {
        let togAll = frmPageList.togAll;
        let numItems = parseInt(frmPageList.total_items.value);
        let check;
    
        // When clicking the link near the checkbox, toggle the box too
        let target = e.target || e.srcElement;
        if (target.tagName.toLowerCase() == "a")
            togAll.forEach((box) => box.checked = !box.checked);
        else if (target.tagName.toLowerCase() == "input")
            togAll.forEach((box) => box.checked = e.target.checked);
    
        check = togAll[0].checked;
        for (let i = 0; i < numItems; i++)
            frmPageList['page_'+i].checked = check;
        reportCounts();
    }
    
    function inverseChecked()
    {
        let numItems = parseInt(frmPageList.total_items.value);    
        for (let i = 0; i < numItems; i++)
            frmPageList['page_'+i].checked = !frmPageList['page_'+i].checked;
        reportCounts();
    }

    function bindReportCount()
    {
        let numItems = parseInt(frmPageList.total_items.value);    
        let chk;
        for (let i = 0; i < numItems; i++) {
            frmPageList['page_'+i].onchange = reportCounts;
        }
            
    }

    function reportCounts()
    {
        let numItems = parseInt(frmPageList.total_items.value);
        let nPages = 0, nCat = 0;
        for (let i = 0; i < numItems; i++) {
            chk = frmPageList['page_'+i];
            if (chk.checked)
                if (parseInt(chk.getAttribute('ns')) == mw.config.get( 'wgNamespaceIds' ).category)
                    nCat++;
                else
                    nPages++;
        }
        frmPageList.page_count.value = nPages;
        frmPageList.subcat_count.value = nCat;
    }
    
    var popup = null;
    var accessing = null;
    var queryWaiting = false;

    var curChoice = -1;
    var txtId = "";

    function suggestCategories(id) {
        var ctl = document.getElementById(id);
        var api = new mw.Api();
        txtId = id;
        if ( accessing ) { queryWaiting = true; return; }
        if ( ctl.value.length == 0 ) return;
        accessing = true;
        api.get({
            formatversion: 2,
            list: 'allpages',
            apprefix: ctl.value,
            apnamespace: mw.config.get( 'wgNamespaceIds' ).category,
            aplimit: sugLimit
        }).then((data) => {
            let categories = data.query.allpages.map((page)=>page.title);
            let clRect = ctl.getClientRects()[0];
            if ( queryWaiting ) {
                queryWaiting = false; accessing = false;
                suggestCategories(id);
                return;
            }
            if (popup) document.body.removeChild(popup);
            if (categories.length > 0) {
                popup = document.createElement("DIV");
                popup.classList.add("catSuggestions");
                categories.forEach((cat) => {
                    let item = document.createElement("DIV");
                    item.classList.add("item");
                    item.innerHTML = cat.replace("Category:", "");
                    item.onmousedown = () => ctl.value = item.innerHTML;
                    popup.appendChild(item);
                });
                nChoices = categories.length;
                popup.style.left = clRect.left+"px";
                popup.style.top = (clRect.bottom+1)+"px";
                document.body.appendChild(popup);
                accessing = false;
            }
            else popup = null;
        });
    }

    function closeSuggestions()
    {
        if (popup) {
            document.body.removeChild(popup);
            popup = null;
            txtId = "";
            curChoice = -1;
        }
    }

    function onKeyDown(e)
    {
        let prevItem, items;
        if (popup)
        {
            prevItem = popup.querySelector(".item.active");
            if (prevItem)
                prevItem.classList.remove('active');
            switch (e.code)
            {
                case "ArrowUp":
                    if (--curChoice <= -1)
                        curChoice = nChoices-1;
                    break;
                case "ArrowDown":
                    if (++curChoice >= nChoices)
                        curChoice = 0;
                    break;
                case "Enter":
                case "Tab":
                    document.getElementById(txtId).value =
                        popup.querySelectorAll(".item")[curChoice].innerHTML;
                    closeSuggestions();
                    e.preventDefault(); // For Enter
                    return false;
            }
            if (curChoice > -1)
                popup.querySelectorAll('.item')[curChoice]
                    .classList.add('active');
        }
    }

    let txtSrc = document.getElementById('txtSrc');
    let txtDest = document.getElementById('txtDest');

    txtSrc.oninput = () => suggestCategories('txtSrc');
    txtSrc.onblur = closeSuggestions;
    txtSrc.autocomplete = "off";
    txtDest.oninput = () => suggestCategories('txtDest');
    txtDest.onblur = closeSuggestions;
    txtDest.autocomplete = "off";

    document.onkeydown = onKeyDown;

    if (document.forms.frmPageList)
    {
        document.forms.frmPageList.togAll.forEach(
            (chkbox) => chkbox.onclick = toggleAll);
        document.querySelectorAll(".aTogAll").forEach(
            (chkbox) => chkbox.onclick = toggleAll);
        document.forms.frmPageList.inverse.forEach(
            (button) => button.onclick = inverseChecked);
        bindReportCount();
    }

} )( mediaWiki );