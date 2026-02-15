var api;

mw.hook('wikipage.content').add( function () {
  initMain();
});

function initMain() {
  api = new mw.Api();
  createButton('div_header','Select All', ()=>selectAll(true));
  createButton('div_header','Unselect All', ()=>selectAll(false));
  createButton('div_header','Create Pages', ()=>createPages());
  showFiles();
}

async function listFiles() {
  try {
    const data = await api.get({ action: 'importarticles-listfiles', format: 'json' });
    return data.files;
  } catch (err) {
    console.error('API error', err);
    return [];
  }
}

async function showFiles() {
  const files = await listFiles();
  console.log(files);
  await displayFiles(files);
}

async function displayFiles(files) {
    div_files.innerHTML = '';

    files.forEach(filename => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item';
        fileDiv.style.marginBottom = '4px';

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = filename;
        checkbox.id = 'chk_' + filename;

        // Label for filename
        const label = document.createElement('label');
        label.htmlFor = 'chk_' + filename;
        label.textContent = filename;
        label.style.marginLeft = '4px';

        fileDiv.appendChild(checkbox);
        fileDiv.appendChild(label);

        div_files.appendChild(fileDiv);
    });
}

function createButton(container, label, func) {
    const button = document.createElement('button');
    button.textContent = label;
    button.className = 'mw-button custom-load-btn';
    document.getElementById(container).appendChild(button);
    button.addEventListener('click', func);
}

function selectAll(check) {
  const checkboxes = div_files.querySelectorAll('.file-item input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = check);
}

function getCheckedFiles() {
  const checkboxes = div_files.querySelectorAll('.file-item input[type="checkbox"]');
  const checkedFiles = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  return checkedFiles;
}

function createPages() {
  const files = getCheckedFiles();
  if (files.length === 0) { alert('No articles selected'); return; }
  
  api.postWithToken('csrf', {
    action: 'importarticles-createpages',
    files: JSON.stringify(files)
  }).then(
    data => {
      mw.notify('Pages created.');
      console.log( data );
    },
    error => {
      mw.notify('Failed to create pages.', { type: 'error' });
      console.error(error);
    }
  );
}
