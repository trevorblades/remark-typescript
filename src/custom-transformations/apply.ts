import {Code} from 'mdast';
import {
  CodeTransformationLocation,
  CodeTransformer,
  NodeTransformer,
  Transformations
} from './definition';
import {iterateArrayOrVal} from '../util/iter';

/**
 * Creates an applicator function that can transform code at each step in the transpilation process
 * @param transformations Custom transformation array
 * @returns Transformation function
 */
export function createTransformationApplicator(
  transformations: Transformations
): {
  applyAtLocation(
    location: CodeTransformationLocation[] | CodeTransformationLocation,
    code: string,
    meta: string | undefined
  ): string;
  applyNodeTransformations(
    originalCodeNode: Code,
    transpiledCodeNode: Code | undefined
  ): void;
} {
  // Store transformations at each location
  const codeTransformationsByLocation: Record<
    string,
    Array<CodeTransformer>
  > = {};
  const nodeTransformations: Array<NodeTransformer> = [];

  for (const transformationFn of transformations) {
    const {code: codeTransformers, node: nodeTransformer} = transformationFn();
    if (codeTransformers) {
      const locations = Object.keys(
        codeTransformers
      ) as CodeTransformationLocation[];
      for (const location of locations) {
        const transformer = codeTransformers[location];
        if (!transformer) {
          continue;
        }
        if (codeTransformationsByLocation[location] === undefined) {
          codeTransformationsByLocation[location] = [];
        }
        codeTransformationsByLocation[location].push(transformer);
      }
    }
    if (nodeTransformer) {
      nodeTransformations.push(nodeTransformer);
    }
  }

  // Create the applicator function
  return {
    applyAtLocation(locationValOrArray, code, meta) {
      // Iterate the transformers for each location
      let modifiedCode = code;
      for (const location of iterateArrayOrVal(locationValOrArray)) {
        for (const transformer of codeTransformationsByLocation[location] ??
          []) {
          modifiedCode = transformer(modifiedCode, meta);
        }
      }
      return modifiedCode;
    },
    applyNodeTransformations(originalCodeNode, transpiledCodeNode) {
      for (const nodeTransformation of nodeTransformations) {
        nodeTransformation(originalCodeNode, transpiledCodeNode);
      }
    }
  };
}
