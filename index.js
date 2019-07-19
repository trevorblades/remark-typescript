const prettier = require('prettier');
const visit = require('unist-util-visit');
const {transformSync} = require('@babel/core');

// TODO: convert to typescript

function insertAt(array, index, item) {
  return [...array.slice(0, index), item, ...array.slice(index)];
}

function isReactComponent(node, tag) {
  return node && node.type === 'jsx' && node.value === tag;
}

module.exports = (
  {markdownAST},
  {wrapper, prettierOptions = {parser: 'babel'}} = {}
) => {
  visit(markdownAST, 'code', (node, index, parent) => {
    if (/tsx?/.test(node.lang)) {
      const prevNode = parent.children[index - 1];
      const nextNode = parent.children[index + 1];

      if (wrapper) {
        const isWrapped =
          isReactComponent(prevNode, `<${wrapper}>`) &&
          isReactComponent(nextNode, `</${wrapper}>`);
        if (!isWrapped) {
          return;
        }
      }

      try {
        const {code} = transformSync(node.value, {
          filename: `file.${node.lang}`,
          retainLines: true,
          presets: ['@babel/typescript']
        });

        if (code.trim()) {
          parent.children = insertAt(parent.children, index + 1, {
            type: 'code',
            lang: /x$/.test(node.lang) ? 'jsx' : 'js',
            value: prettier.format(code, prettierOptions).trim()
          });
        }
      } catch (error) {
        console.error(error.message);
      }
    }
  });

  return markdownAST;
};
