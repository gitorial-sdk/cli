const monacoCss = `
:root {
  --content-max-width: 100% !important;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
}

.page,
.content,
.chapter,
.content main {
  height: 100%;
}

.page {
  overflow-x: hidden;
}

.nav-chapters {
  top: auto;
  margin: 10px;
  font-size: 2.5em;
  text-align: center;
  text-decoration: none;
  width: 90px;
  border-radius: 5px;
}

.page {
  max-width: none;
}

.content {
  max-width: none;
  padding: 0;
  overflow-x: hidden;
}

.gitorial-step {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
  min-height: calc(100vh - 102px);
}

.gitorial-step-text,
.gitorial-step-editor {
  width: 100%;
  padding: 0;
}

.gitorial-step-text h1,
.gitorial-step-text h2,
.gitorial-step-text h3 {
  margin-top: 1.4em;
}

.gitorial-step-text p {
  line-height: 1.6;
}

.gitorial-monaco {
  margin-top: 0;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  overflow: hidden;
  background: #0f0f10;
  display: flex;
  flex-direction: column;
  height: auto;
}

.gitorial-monaco-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: #1b1b1d;
  border-bottom: 1px solid #2a2a2d;
  color: #f0f0f2;
  font-family: "Inter", system-ui, sans-serif;
}

.gitorial-monaco-toolbar .label {
  font-size: 12px;
  opacity: 0.8;
}

.gitorial-monaco-toolbar .file-select {
  background: #2b2b2f;
  color: #f0f0f2;
  border: 1px solid #3a3a3f;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
}

.gitorial-monaco-toolbar .toggle {
  margin-left: auto;
  background: #f0f0f2;
  color: #1b1b1d;
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.gitorial-monaco-toolbar .toggle.secondary {
  background: transparent;
  color: #f0f0f2;
  border: 1px solid #3a3a3f;
}

.gitorial-monaco-toolbar .diff-toggle {
  background: transparent;
  color: #f0f0f2;
  border: 1px solid #3a3a3f;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.gitorial-monaco-editor {
  height: 70vh;
  min-height: 520px;
}

.gitorial-monaco-footer {
  padding: 10px 16px;
  background: #1b1b1d;
  border-top: 1px solid #2a2a2d;
  font-size: 12px;
  color: #b7b7c0;
  font-family: "Inter", system-ui, sans-serif;
}

@media screen and (min-width: 1081px) {
  .gitorial-step-text,
  .gitorial-step-editor {
    height: calc(100vh - 102px);
    overflow: auto;
    padding: 0 5px 20px 5px;
  }
}

@media (max-width: 980px) {
  .gitorial-step {
    grid-template-columns: 1fr;
  }

  .gitorial-step-text,
  .gitorial-step-editor {
    height: auto;
    overflow: visible;
  }

  .gitorial-monaco {
    height: auto;
  }

  .gitorial-monaco-editor {
    min-height: 480px;
    height: 60vh;
  }
}
`;

const monacoSetup = `
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
      case 'patch':
      case 'diff':
        return 'diff';
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
    iframe.srcdoc = \`
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
      let diffEditor;
      let currentMode = 'single';
      function getContainer() {
        return document.getElementById('editor');
      }
      function clearContainer() {
        const container = getContainer();
        container.innerHTML = '';
        return container;
      }
      function disposeEditor() {
        if (editor) {
          editor.dispose();
          editor = null;
        }
      }
      function disposeDiffEditor() {
        if (diffEditor) {
          diffEditor.dispose();
          diffEditor = null;
        }
      }
      function ensureEditor(content, language) {
        window.require(['vs/editor/editor.main'], function () {
          if (currentMode !== 'single') {
            disposeDiffEditor();
            clearContainer();
            currentMode = 'single';
          }
          if (!editor) {
            editor = monaco.editor.create(getContainer(), {
              value: content,
              language: language,
              theme: 'vs-dark',
              automaticLayout: true,
              readOnly: true,
            });
          } else {
            const model = monaco.editor.createModel(content, language);
            editor.setModel(model);
          }
        });
      }
      function ensureDiffEditor(original, modified, language) {
        window.require(['vs/editor/editor.main'], function () {
          if (currentMode !== 'diff') {
            disposeEditor();
            clearContainer();
            currentMode = 'diff';
          }
          if (!diffEditor) {
            diffEditor = monaco.editor.createDiffEditor(getContainer(), {
              theme: 'vs-dark',
              automaticLayout: true,
              readOnly: true,
              renderSideBySide: true,
            });
          }
          const originalModel = monaco.editor.createModel(original, language);
          const modifiedModel = monaco.editor.createModel(modified, language);
          diffEditor.setModel({ original: originalModel, modified: modifiedModel });
        });
      }
      window.addEventListener('message', function (event) {
        const data = event.data || {};
        if (!data.type) {
          return;
        }
        if (data.type === 'init' || data.type === 'set') {
          ensureEditor(data.content || '', data.language || 'plaintext');
        } else if (data.type === 'diff') {
          ensureDiffEditor(data.original || '', data.modified || '', data.language || 'plaintext');
        }
      });
    </script>
  </body>
</html>\`;
    return iframe;
  }

  async function initMonaco(container) {
    const manifestUrl = container.dataset.manifest;
    const config = await loadJson(manifestUrl);

    const toolbar = container.querySelector('[data-gitorial-toolbar]');
    const select = container.querySelector('[data-gitorial-files]');
    const toggle = container.querySelector('[data-gitorial-toggle]');
    const diffToggle = container.querySelector('[data-gitorial-diff]');
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
    let previousMode = 'template';
    let selectedLabel = null;
    let templateFiles = config.template || [];
    let solutionFiles = config.solution || [];

    if (!solutionFiles.length) {
      toggle.style.display = 'none';
      footer.textContent = 'Template view only.';
      diffToggle.style.display = 'none';
    } else {
      footer.textContent = 'Template view. Click View solution to compare.';
    }

    function updateFileOptions() {
      let list = currentMode === 'template' ? templateFiles : solutionFiles;
      if (currentMode === 'diff') {
        const byLabel = new Map();
        templateFiles.forEach((file) => byLabel.set(file.label, file));
        solutionFiles.forEach((file) => {
          if (!byLabel.has(file.label)) {
            byLabel.set(file.label, file);
          }
        });
        list = Array.from(byLabel.values());
      }
      select.innerHTML = '';
      list.forEach((file, index) => {
        const option = document.createElement('option');
        option.value = file.label;
        option.textContent = file.label;
        if (selectedLabel && selectedLabel === file.label) {
          option.selected = true;
        } else if (!selectedLabel && index === 0) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      if (!selectedLabel && list.length) {
        selectedLabel = list[0].label;
      }
    }

    function getFileContent(filePath) {
      return fetch(filePath).then((res) => res.text());
    }

    function findFile(list, label) {
      return list.find((file) => file.label === label) || null;
    }

    async function postToIframe(payload) {
      if (iframeReady) {
        iframe.contentWindow.postMessage(payload, '*');
      } else {
        pendingPayload = payload;
      }
    }

    async function setEditorFile(label) {
      if (!label) {
        return;
      }
      if (currentMode === 'diff') {
        const templateFile = findFile(templateFiles, label);
        const solutionFile = findFile(solutionFiles, label);
        const original = templateFile ? await getFileContent(templateFile.path) : '';
        const modified = solutionFile ? await getFileContent(solutionFile.path) : '';
        const language = detectMode((solutionFile || templateFile || { path: '' }).path);
        await postToIframe({ type: 'diff', original, modified, language });
        return;
      }

      const list = currentMode === 'template' ? templateFiles : solutionFiles;
      const file = findFile(list, label);
      if (!file) {
        return;
      }
      const content = await getFileContent(file.path);
      const language = detectMode(file.path);
      await postToIframe({ type: 'set', content, language });
    }

    function currentFiles() {
      return currentMode === 'template' ? templateFiles : solutionFiles;
    }

    updateFileOptions();
    if (!select.value) {
      footer.textContent = 'No files available for this step.';
      toggle.style.display = 'none';
      return;
    }
    selectedLabel = select.value;
    await setEditorFile(selectedLabel);

    select.addEventListener('change', async () => {
      selectedLabel = select.value;
      await setEditorFile(selectedLabel);
    });

    toggle.addEventListener('click', async () => {
      if (!solutionFiles.length) {
        return;
      }
      currentMode = currentMode === 'template' ? 'solution' : 'template';
      updateFileOptions();
      setButtonState(toggle, currentMode === 'template');
      toggle.textContent = currentMode === 'template' ? 'View solution' : 'Back to template';
      toggle.disabled = currentMode === 'diff';
      footer.textContent =
        currentMode === 'template'
          ? 'Template view. Click View solution to compare.'
          : 'Solution view. Click Back to template to continue.';
      if (select.value) {
        selectedLabel = select.value;
        await setEditorFile(selectedLabel);
      }
    });

    diffToggle.addEventListener('click', async () => {
      if (!solutionFiles.length) {
        return;
      }
      if (currentMode === 'diff') {
        currentMode = previousMode;
        diffToggle.textContent = 'View diff';
      } else {
        previousMode = currentMode;
        currentMode = 'diff';
        diffToggle.textContent = 'Back to code';
      }
      updateFileOptions();
      toggle.disabled = currentMode === 'diff';
      if (select.value) {
        selectedLabel = select.value;
        await setEditorFile(selectedLabel);
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
`;

const monacoEmbed = (relativeAssetBase, manifestPath) => `
<link rel="stylesheet" href="${relativeAssetBase}/monaco-setup.css">
<script src="${relativeAssetBase}/monaco-setup.js"></script>

<div class="gitorial-monaco" data-gitorial-monaco data-manifest="${manifestPath}">
  <div class="gitorial-monaco-toolbar" data-gitorial-toolbar>
    <span class="label">File</span>
    <select class="file-select" data-gitorial-files></select>
    <button class="toggle" data-gitorial-toggle>View solution</button>
    <button class="diff-toggle" data-gitorial-diff>View diff</button>
  </div>
  <div class="gitorial-monaco-editor" data-gitorial-editor></div>
  <div class="gitorial-monaco-footer" data-gitorial-footer></div>
</div>

<script>
  if (window.__gitorialBoot) {
    window.__gitorialBoot();
  }
</script>
`;

module.exports = {
	monacoCss,
	monacoSetup,
	monacoEmbed,
};
