import {Code} from 'mdast';

export type CodeTransformer = (
  code: string,
  meta: string | undefined
) => string;

export type NodeTransformer = (
  originalCodeNode: Code,
  transpiledCodeNode?: Code
) => void;

/**
 * Location that the transformation occurs
 */
export type CodeTransformationLocation =
  | 'beforeTranspile'
  | 'afterTranspile'
  | 'beforeFormat'
  | 'afterFormat';

export type Transformation = Partial<{
  code: Partial<Record<CodeTransformationLocation, CodeTransformer>>;
  node: NodeTransformer;
}>;

export type Transformations = Array<() => Transformation>;
