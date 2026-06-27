import { basicSetup, EditorView } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';

const languageExtensions = {
  html: html(),
  js: javascript(),
  css: css(),
};

const cspNonce = document.querySelector('meta[name="csp-nonce"]')?.content || '';
const editors = new Map();

for (const source of document.querySelectorAll('[data-editor]')) {
  const language = source.dataset.editor;
  const host = document.querySelector(`[data-editor-host="${language}"]`);

  if (!host) continue;

  const view = new EditorView({
    doc: source.value,
    extensions: [
      basicSetup,
      languageExtensions[language],
      EditorView.lineWrapping,
      EditorView.cspNonce.of(cspNonce),
    ],
    parent: host,
  });

  editors.set(language, view);
}

const form = document.querySelector('[data-tutorial-form]');

if (form) {
  form.addEventListener('submit', () => {
    for (const [language, view] of editors) {
      const output = form.querySelector(`[data-editor-output="${language}"]`);
      if (output) {
        output.value = view.state.doc.toString();
      }
    }
  });

  requestAnimationFrame(() => {
    form.requestSubmit();
  });
}
