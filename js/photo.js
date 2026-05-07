// ─── Photo module ────────────────────────────────────────────────────────────
(function () {
  const widget = document.getElementById('mod-photo');
  if (!widget) return;

  const stage = document.getElementById('photoStage');
  const image = document.getElementById('photoImage');
  const empty = document.getElementById('photoEmpty');
  const input = document.getElementById('photoInput');
  const chooseBtn = document.getElementById('photoChooseBtn');
  const clearBtn = document.getElementById('photoClearBtn');

  const IMAGE_KEY = 'startpage:photo:image';
  const NAME_KEY = 'startpage:photo:name';

  function readStored() {
    try {
      return {
        src: localStorage.getItem(IMAGE_KEY) || '',
        name: localStorage.getItem(NAME_KEY) || '',
      };
    } catch {
      return { src: '', name: '' };
    }
  }

  function writeStored(src, name = '') {
    try {
      if (src) {
        localStorage.setItem(IMAGE_KEY, src);
        localStorage.setItem(NAME_KEY, name);
      } else {
        localStorage.removeItem(IMAGE_KEY);
        localStorage.removeItem(NAME_KEY);
      }
    } catch {
      // Ignore storage failures and keep the widget usable.
    }
  }

  function setPreview(src, name = '') {
    const hasImage = Boolean(src);
    stage.classList.toggle('has-image', hasImage);
    stage.classList.remove('dragover');

    if (hasImage) {
      image.src = src;
      image.alt = name ? `Uploaded photo: ${name}` : 'Uploaded photo preview';
      clearBtn.disabled = false;
      empty.setAttribute('aria-hidden', 'true');
    } else {
      image.removeAttribute('src');
      image.alt = 'Uploaded photo preview';
      clearBtn.disabled = true;
      empty.removeAttribute('aria-hidden');
    }
  }

  function applyFile(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      if (!src) return;
      setPreview(src, file.name);
      writeStored(src, file.name);
    };
    reader.readAsDataURL(file);
  }

  chooseBtn.addEventListener('click', () => input.click());
  stage.addEventListener('click', e => {
    if (e.target.closest('button, input, a')) return;
    input.click();
  });

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (file) applyFile(file);
    input.value = '';
  });

  clearBtn.addEventListener('click', () => {
    setPreview('', '');
    writeStored('', '');
  });

  stage.addEventListener('dragover', e => {
    e.preventDefault();
    stage.classList.add('dragover');
  });

  stage.addEventListener('dragleave', e => {
    if (!stage.contains(e.relatedTarget)) {
      stage.classList.remove('dragover');
    }
  });

  stage.addEventListener('drop', e => {
    e.preventDefault();
    stage.classList.remove('dragover');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) applyFile(file);
  });

  const stored = readStored();
  setPreview(stored.src, stored.name);
})();
