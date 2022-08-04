export type CodeTransformer = (code: string, meta?: string) => string;

/**
 * Location that the transformation occurs
 */
export type TransformationLocation =
  | 'beforeTranspile'
  | 'afterTranspile'
  | 'beforeFormat'
  | 'afterFormat';

export type Transformation = Partial<
  Record<TransformationLocation, CodeTransformer>
>;

export type Transformations = Array<() => Transformation>;
