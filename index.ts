import * as visit from 'unist-util-visit';
import {format} from 'prettier';
import {transformSync} from '@babel/core';

function insertAt(array: Node[], index: number, item: Node): Node[] {
  return [...array.slice(0, index), item, ...array.slice(index)];
}

interface Node {
  type: string;
  lang?: string;
  value?: string;
  children?: Node[];
}

function isReactComponent(node: Node, tag: string): boolean {
  return node && node.type === 'jsx' && node.value === tag;
}

interface Options {
  wrapperComponent?: string;
  prettierOptions?: object;
}

export = (
  {markdownAST},
  {wrapperComponent, prettierOptions = {parser: 'babel'}}: Options = {}
): object => {
  visit(
    markdownAST,
    'code',
    (node: Node, index: number, parent: Node): void => {
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
