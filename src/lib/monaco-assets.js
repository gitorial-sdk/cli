const monacoCss = `
.gitorial-monaco {
  margin-top: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 12px;
  overflow: hidden;
  background: #0f0f10;
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

.gitorial-monaco-editor {
  height: 520px;
}

.gitorial-monaco-footer {
  padding: 10px 16px;
  background: #1b1b1d;
  border-top: 1px solid #2a2a2d;
  font-size: 12px;
  color: #b7b7c0;
  font-family: "Inter", system-ui, sans-serif;
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

  async function initMonaco(container) {
    const manifestUrl = container.dataset.manifest;
    const config = await loadJson(manifestUrl);

    const toolbar = container.querySelector('[data-gitorial-toolbar]');
    const select = container.querySelector('[data-gitorial-files]');
    const toggle = container.querySelector('[data-gitorial-toggle]');
    const footer = container.querySelector('[data-gitorial-footer]');
    const editorNode = container.querySelector('[data-gitorial-editor]');

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

    let editor;
    async function setEditorFile(filePath) {
      const content = await getFileContent(filePath);
      const language = detectMode(filePath);
      if (!editor) {
        editor = monaco.editor.create(editorNode, {
          value: content,
          language,
          theme: 'vs-dark',
          automaticLayout: true,
          readOnly: true,
        });
      } else {
        const model = monaco.editor.createModel(content, language);
        editor.setModel(model);
      }
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
`;

const monacoEmbed = (relativeAssetBase, manifestPath) => `
<link rel="stylesheet" href="${relativeAssetBase}/monaco-setup.css">
<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/loader.js"></script>
<script src="${relativeAssetBase}/monaco-setup.js"></script>

<div class="gitorial-monaco" data-gitorial-monaco data-manifest="${manifestPath}">
  <div class="gitorial-monaco-toolbar" data-gitorial-toolbar>
    <span class="label">File</span>
    <select class="file-select" data-gitorial-files></select>
    <button class="toggle" data-gitorial-toggle>View solution</button>
  </div>
  <div class="gitorial-monaco-editor" data-gitorial-editor></div>
  <div class="gitorial-monaco-footer" data-gitorial-footer></div>
</div>

<script>
  if (window.require) {
    window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs' } });
    window.require(['vs/editor/editor.main'], function () {
      if (window.__gitorialBoot) {
        window.__gitorialBoot();
      }
    });
  }
</script>
`;

module.exports = {
	monacoCss,
	monacoSetup,
	monacoEmbed,
};
