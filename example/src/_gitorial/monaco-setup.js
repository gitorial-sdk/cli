(function () {
  function loadJson(url) {
    return fetch(url).then((res) => {
      if (!res.ok) {
        throw new Error('Failed to load ' + url);
      }
      return res.json();
    });
  }

  function detectMode(filePath) {
    const ext = filePath.split('.').pop();
    switch (ext) {
      case 'rs':
        return 'rust';
      case 'toml':
        return 'toml';
      case 'js':
        return 'javascript';
      case 'json':
        return 'json';
      case 'ts':
        return 'typescript';
      default:
        return 'plaintext';
    }
  }

  function setButtonState(button, isPrimary) {
    if (isPrimary) {
      button.classList.remove('secondary');
    } else {
      button.classList.add('secondary');
    }
  }

  function buildIframe() {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Gitorial Editor');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.srcdoc = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; height: 100%; background: #0f0f10; }
      #editor { height: 100%; }
    </style>
  </head>
  <body>
    <div id="editor"></div>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/loader.js"></script>
    <script>
      window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs' } });
      let editor;
      function ensureEditor(content, language) {
        if (!editor) {
          window.require(['vs/editor/editor.main'], function () {
            editor = monaco.editor.create(document.getElementById('editor'), {
              value: content,
              language: language,
              theme: 'vs-dark',
              automaticLayout: true,
              readOnly: true,
            });
          });
        } else {
          const model = monaco.editor.createModel(content, language);
          editor.setModel(model);
        }
      }
      window.addEventListener('message', function (event) {
        const data = event.data || {};
        if (!data.type) {
          return;
        }
        if (data.type === 'init' || data.type === 'set') {
          ensureEditor(data.content || '', data.language || 'plaintext');
        }
      });
    </script>
  </body>
</html>`;
    return iframe;
  }

  async function initMonaco(container) {
    const manifestUrl = container.dataset.manifest;
    const config = await loadJson(manifestUrl);

    const select = container.querySelector('[data-gitorial-files]');
    const toggle = container.querySelector('[data-gitorial-toggle]');
    const footer = container.querySelector('[data-gitorial-footer]');
    const editorNode = container.querySelector('[data-gitorial-editor]');
    const iframe = buildIframe();
    editorNode.appendChild(iframe);

    let iframeReady = false;
    let pendingPayload = null;

    iframe.addEventListener('load', () => {
      iframeReady = true;
      if (pendingPayload) {
        iframe.contentWindow.postMessage(pendingPayload, '*');
        pendingPayload = null;
      }
    });

    let currentMode = 'template';
    let templateFiles = config.template || [];
    let solutionFiles = config.solution || [];

    if (!solutionFiles.length) {
      toggle.style.display = 'none';
      footer.textContent = 'Template view only.';
    } else {
      footer.textContent = 'Template view. Click View solution to compare.';
    }

    function updateFileOptions() {
      const list = currentMode === 'template' ? templateFiles : solutionFiles;
      select.innerHTML = '';
      list.forEach((file, index) => {
        const option = document.createElement('option');
        option.value = file.path;
        option.textContent = file.label;
        if (index === 0) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    }

    function getFileContent(filePath) {
      return fetch(filePath).then((res) => res.text());
    }

    async function setEditorFile(filePath) {
      const content = await getFileContent(filePath);
      const language = detectMode(filePath);
      const payload = { type: 'set', content, language };
      if (iframeReady) {
        iframe.contentWindow.postMessage(payload, '*');
      } else {
        pendingPayload = payload;
      }
    }

    updateFileOptions();
    if (!select.value) {
      footer.textContent = 'No files available for this step.';
      toggle.style.display = 'none';
      return;
    }
    await setEditorFile(select.value);

    select.addEventListener('change', async () => {
      await setEditorFile(select.value);
    });

    toggle.addEventListener('click', async () => {
      if (!solutionFiles.length) {
        return;
      }
      currentMode = currentMode === 'template' ? 'solution' : 'template';
      updateFileOptions();
      setButtonState(toggle, currentMode === 'template');
      toggle.textContent = currentMode === 'template' ? 'View solution' : 'Back to template';
      footer.textContent =
        currentMode === 'template'
          ? 'Template view. Click View solution to compare.'
          : 'Solution view. Click Back to template to continue.';
      if (select.value) {
        await setEditorFile(select.value);
      }
    });
  }

  function boot() {
    const containers = document.querySelectorAll('[data-gitorial-monaco]');
    if (!containers.length) {
      return;
    }
    containers.forEach((container) => {
      initMonaco(container).catch((error) => {
        console.error(error);
      });
    });
  }

  window.__gitorialBoot = boot;
})();
