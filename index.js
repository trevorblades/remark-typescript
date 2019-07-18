const ts = require('typescript');
const visit = require('unist-util-visit');

// TODO: convert to typescript

const compilerOptions = {
  target: ts.ScriptTarget.ES2017,
  jsx: ts.JsxEmit.Preserve
};

function insertAt(array, index, item) {
  return [...array.slice(0, index), item, ...array.slice(index)];
}

function isReactComponent(node, tag) {
  return node && node.type === 'jsx' && node.value === tag;
}

module.exports = ({markdownAST}) => {
  visit(markdownAST, 'code', (node, index, parent) => {
    if (/tsx?/.test(node.lang)) {
      const prevNode = parent.children[index - 1];
      const nextNode = parent.children[index + 1];
      // TODO: make wrapping component checks opt-in
      // have the user specify the tagname to look for with options
      if (
        isReactComponent(prevNode, '<MultiCodeBlock>') &&
        isReactComponent(nextNode, '</MultiCodeBlock>')
      ) {
        const value = ts.transpile(node.value, compilerOptions).trim();
        if (value) {
          parent.children = insertAt(parent.children, index + 1, {
            type: 'code',
            lang: /x$/.test(node.lang) ? 'jsx' : 'js',
            value
          });
        }
      }
    }
  });

  return markdownAST;
};
