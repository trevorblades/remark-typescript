const ts = require('typescript');
const visit = require('unist-util-visit');

const compilerOptions = {
  target: ts.ScriptTarget.ES2017,
  jsx: ts.JsxEmit.Preserve
};

function insertAt(array, index, item) {
  return [...array.slice(0, index), item, ...array.slice(index)];
}

module.exports = ({markdownAST}) => {
  visit(markdownAST, 'code', (node, index, parent) => {
    if (/tsx?/.test(node.lang)) {
      const value = ts.transpile(node.value, compilerOptions).trim();
      if (value) {
        parent.children = insertAt(parent.children, index + 1, {
          type: 'code',
          lang: /x$/.test(node.lang) ? 'jsx' : 'js',
          value
        });
      }
    }
  });

  return markdownAST;
};
