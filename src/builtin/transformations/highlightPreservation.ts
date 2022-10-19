import fenceparser from 'fenceparser';
import rangeParser from 'parse-numeric-range';
import {Transformation} from '../../custom-transformations/definition';
import {iterateDefined} from '../../util/iter';

function getHighlightedLinesFromNode(meta?: string) {
  const {highlight} = fenceparser(meta ?? '') ?? {};
  if (!highlight) {
    return [];
  }
  return rangeParser(Object.keys(highlight).toString());
}

export function highlightPreservation(): () => Transformation {
  return () => ({
    code: {
      beforeFormat(code) {
        return code
          .split('\n')
          .map(line => {
            if (/\s?\/\/\s?highlight-line/.test(line)) {
              return (
                '/* highlight-line */' +
                line.replace(/\s?\/\/\s?highlight-line/, '')
              );
            }
            return line;
          })
          .join('\n');
      },
      afterTranspile(code, meta) {
        const highlightedLines = getHighlightedLinesFromNode(meta);
        return code
          .split('\n')
          .map((line, index) => {
            const isHighlighted = highlightedLines.includes(index + 1);
            if (!isHighlighted) {
              return line;
            }
            return '/* highlight-line */' + line;
          })
          .join('\n');
      }
    },
    node(originalCodeNode, transpiledCodeNode) {
      // Update the TS code block to manually highlight each desired line
      const highlightedLines = getHighlightedLinesFromNode(
        originalCodeNode.meta
      );
      originalCodeNode.value = originalCodeNode.value
        .split('\n')
        .map((line, i) => {
          if (highlightedLines.includes(i + 1)) {
            return '/* highlight-line */' + line;
          }
          if (/\s?\/\/\s?highlight-line/.test(line)) {
            return (
              '/* highlight-line */' +
              line.replace(/\s?\/\/\s?highlight-line/, '')
            );
          }
          return line;
        })
        .join('\n');

      // Update the JS code block to remove lines that are just highlighted
      if (transpiledCodeNode) {
        transpiledCodeNode.value = transpiledCodeNode.value
          .split('\n')
          .filter(line => !line.match(new RegExp('^/\\* highlight-line \\*/$')))
          .join('\n');
      }

      // Iterate all nodes that are defined (transpiled may not be)
      for (const node of iterateDefined([
        originalCodeNode,
        transpiledCodeNode
      ])) {
        // Remove highlight tokens based on fenceparser lexer
        // https://github.com/frencojobs/fenceparser/blob/main/src/Lexer.ts
        const highlightPattern = /\s*\{[0-9.,-]*[0-9]\}/g;
        node.meta = node.meta?.replace(highlightPattern, '');
      }
    }
  });
}
