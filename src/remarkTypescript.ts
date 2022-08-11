import visit, {Visitor} from 'unist-util-visit';
import {Code} from 'mdast';
import {Parent} from 'unist';
import {Options as PrettierOptions, format} from 'prettier';
import {
  Transformations,
  builtinTransformations,
  createTransformationApplicator
} from './custom-transformations';
import {Transformer} from 'unified';
import {transformSync} from '@babel/core';

export type FilterTest = (
  node: Code,
  parent: Parent,
  index: number,
  meta?: string
) => boolean;

interface Options {
  /**
   * Set if you want to throw on error, otherwise it logs to stderr
   */
  throwOnError?: boolean;
  /**
   * Custom prettier options for the formatting step
   */
  prettierOptions?: PrettierOptions;
  /**
   * Transform the code during different stages
   */
  customTransformations?: Transformations;
  /**
   * Determine if a particular ts/tsx code block should be skipped.
   * @example In MDX, you could check for a particular wrapping component
   */
  filter?: FilterTest;
}

/**
 * Transforms ts and tsx code blocks into their JS counterparts for multi-code block automation
 * @param param options
 * @returns Transformer
 */
export function remarkTypescript({
  throwOnError,
  prettierOptions = {},
  customTransformations = [],
  filter
}: Options = {}): Transformer {
  // Push the default pattern preservation transformer
  customTransformations.push(
    builtinTransformations.patternPreservationTransformation()
  );

  // Create the transformation applicator based on the custom transformations
  const {
    applyAtLocation,
    applyNodeTransformations
  } = createTransformationApplicator(customTransformations);

  return function transformer(tree): void {
    const visitor: Visitor<Code> = (node, index, parent) => {
      // This plugin only cares about tsx and ts code blocks
      if (node.lang && parent !== undefined && /^tsx?/.test(node.lang)) {
        // Extract and destructure meta from node so modifications do not effect the original
        const {meta} = node;

        // Utilize the should skip method if it exists
        if (filter && !filter(node, parent, index, meta)) {
          return;
        }

        try {
          // Transform the code using babel
          const babelResult = transformSync(
            applyAtLocation('beforeTranspile', node.value, meta),
            {
              filename: `file.${node.lang}`,
              retainLines: true,
              presets: ['@babel/typescript']
            }
          );

          // Invoke the afterTranspile hook, if no code is returned utilize an empty string
          const code = applyAtLocation(
            'afterTranspile',
            babelResult?.code ?? '',
            meta
          );

          let transpiledCodeNode: Code | undefined;

          if (code.trim()) {
            // Apply the beforeFormat transformation and format the code
            const formattedCode = format(
              applyAtLocation('beforeFormat', code, meta),
              {
                ...prettierOptions,
                parser: 'babel'
              }
            ).trim();
            transpiledCodeNode = {
              type: 'code',
              lang: node.lang?.replace(/^ts|(?<=\.)ts/g, 'js'),
              meta: node.meta?.replace(/\.ts/, '.js'),
              value: applyAtLocation('afterFormat', formattedCode, meta)
            };
            // Insert the new code block replacing "ts" for "js"
            parent.children.splice(index + 1, 0, transpiledCodeNode);
          }

          // Update the original code block with the formatting instructions
          // Useful for cleaning up any extraneous comments like // preserve-line
          node.value = applyAtLocation(
            ['beforeFormat', 'afterFormat'],
            node.value,
            meta
          );

          applyNodeTransformations(node, transpiledCodeNode);

          // For transpiled code, sometimes extra spaces might occur because of line removal
          // This will collapse newlines above 2 down to 1
          if (transpiledCodeNode) {
            transpiledCodeNode.value = transpiledCodeNode.value.replace(
              /(?<=\n)\n{2,}/gm,
              '\n'
            );
          }
        } catch (error) {
          if (throwOnError) {
            throw error;
          } else if (error instanceof Error) {
            // eslint-disable-next-line no-console
            console.error(error.message);
          }
        }
      }
    };

    visit(tree, 'code', visitor);
  };
}
