import * as visit from 'unist-util-visit';
import {Code, Parent} from 'mdast';
import {Node} from 'unist';
import {Options as PrettierOptions, format} from 'prettier';
import {transformSync} from '@babel/core';

function insertAt(
  array: Parent['children'],
  index: number,
  item: Code
): Parent['children'] {
  return [...array.slice(0, index), item, ...array.slice(index)];
}

function isReactComponent(node: Node, tag: string): boolean {
  return node && node.type === 'jsx' && node.value === tag;
}

interface Options {
  wrapperComponent?: string;
  prettierOptions?: PrettierOptions;
}

export = function visitor(
  {markdownAST},
  {wrapperComponent, prettierOptions = {parser: 'babel'}}: Options = {}
): object {
  visit(
    markdownAST,
    'code',
    (node: Code, index: number, parent: Parent): void => {
      if (/tsx?/.test(node.lang)) {
        const prevNode = parent.children[index - 1];
        const nextNode = parent.children[index + 1];

        if (wrapperComponent) {
          const isWrapped =
            isReactComponent(prevNode, `<${wrapperComponent}>`) &&
            isReactComponent(nextNode, `</${wrapperComponent}>`);
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
              value: format(code, prettierOptions).trim()
            });
          }
        } catch (error) {
          console.error(error.message);
        }
      }
    }
  );

  return markdownAST;
};
