import * as visit from 'unist-util-visit';
import {Code, Parent} from 'mdast';
import {Node} from 'unist';
import {Options as PrettierOptions, format} from 'prettier';
import {transformSync} from '@babel/core';

const PRESERVE_COMMENT = '// preserve-line';
const PRESERVE_PATTERN = new RegExp(`\\s${PRESERVE_COMMENT}$`);

function removePreserveComment(line: string): string {
  return line.replace(PRESERVE_PATTERN, '');
}

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

export = function plugin(
  {markdownAST},
  {wrapperComponent, prettierOptions = {parser: 'babel'}}: Options = {}
): Parent {
  function visitor(node: Code, index: number, parent: Parent): void {
    if (/^tsx?/.test(node.lang)) {
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
        const tsLines = node.value.split('\n');
        const preservedLines = tsLines
          .filter((line: string): boolean => PRESERVE_PATTERN.test(line))
          .map(removePreserveComment);

        const {code} = transformSync(node.value, {
          filename: `file.${node.lang}`,
          retainLines: true,
          presets: ['@babel/typescript']
        });

        if (code.trim()) {
          let preservedIndex = -1;
          const jsLines = code.split('\n');
          const preservedCode = jsLines
            .map((line: string): string => {
              if (line === PRESERVE_COMMENT) {
                preservedIndex++;
                return preservedLines[preservedIndex];
              }
              return line;
            })
            .join('\n');

          parent.children = insertAt(parent.children, index + 1, {
            type: 'code',
            lang: node.lang.replace(/^ts|(?<=\.)ts/g, 'js'),
            value: format(preservedCode, prettierOptions).trim()
          });
        }

        node.value = tsLines.map(removePreserveComment).join('\n');
      } catch (error) {
        console.error(error.message);
      }
    }
  }

  visit(markdownAST, 'code', visitor);

  return markdownAST;
};
