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
   * Transform the code during differnet stages
   */
  customTransformations?: Transformations;
  /**
   * Determine if a particular ts/tsx code block should be skipped.
   * @example In MDX, you could check for a particular wrapping component
   */
  shouldSkip?: (
    node: Code,
    parent: Parent<any>,
    index: number,
    meta?: string
  ) => boolean;
}

/**
 * Transforms ts and tsx code blocks into their JS counterparts for multi-code block automation
 * @param param options
 * @returns Transformer
 */
export default function remarkTypescript({
  throwOnError,
  prettierOptions = {},
  customTransformations = [],
  shouldSkip
}: Options = {}): Transformer {
  // Push the default pattern preservation transformer
  customTransformations.push(
    builtinTransformations.patternPreservationTransformation
  );

  // Create the transformatino applicator based on the custom transformations
  const applyTransformation = createTransformationApplicator(
    customTransformations
  );

  return function transformer(tree): void {
    const visitor: Visitor<Code> = (node, index, parent) => {
      // This plugin only cares about tsx and ts code blocks
      if (node.lang && parent !== undefined && /^tsx?/.test(node.lang)) {
        // Extract and destructure meta from node so modifications do not effect the original
        const {meta} = node;

        // Utilize the should skip method if it exists
        if (shouldSkip && shouldSkip(node, parent, index, meta)) {
          return;
        }

        try {
          // Transform the code using babel
          const babelResult = transformSync(
            applyTransformation('beforeTranspile', node.value, meta),
            {
              filename: `file.${node.lang}`,
              retainLines: true,
              presets: ['@babel/typescript']
            }
          );

          // Invoke the afterTranspile hook, if no code is returned utilize an empty string
          const code = applyTransformation(
            'afterTranspile',
            babelResult?.code ?? '',
            meta
          );

          if (code.trim()) {
            // Apply the beforeFormat transformation and format the code
            const formattedCode = format(
              applyTransformation('beforeFormat', code, meta),
              {
                ...prettierOptions,
                parser: 'babel'
              }
            ).trim();
            // Insert the new code block replacing "ts" for "js"
            parent.children.splice(index + 1, 0, {
              type: 'code',
              lang: node.lang?.replace(/^ts|(?<=\.)ts/g, 'js'),
              meta: node.meta?.replace(/\.ts/, '.js'),
              value: applyTransformation('afterFormat', formattedCode, meta)
            } as any);
          }

          // Update the original code block with the formatting instructions
          // Useful for cleaning up any extraneous comments like // preserve-line
          node.value = applyTransformation(
            ['beforeFormat', 'afterFormat'],
            node.value,
            meta
          );
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
