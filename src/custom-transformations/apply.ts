import {
  CodeTransformer,
  TransformationLocation,
  Transformations
} from './definition';

/**
 * Creates an applicator function that can transform code at each step in the transpilation process
 * @param transformations Custom transformtion array
 * @returns Transformation function
 */
export function createTransformationApplicator(
  transformations: Transformations
): (
  location: TransformationLocation[] | TransformationLocation,
  code: string,
  meta?: string
) => string {
  // Store transformations at each locaation
  const transformationsByLocation: Record<string, Array<CodeTransformer>> = {};

  for (const transformationFn of transformations) {
    const transformation = transformationFn();
    const locations = Object.keys(transformation) as TransformationLocation[];
    for (const location of locations) {
      const transformer = transformation[location];
      if (transformer) {
        if (transformationsByLocation[location] === undefined) {
          transformationsByLocation[location] = [];
        }
        transformationsByLocation[location].push(transformer);
      }
    }
  }

  // Create the applicator function
  return (locationValOrArray, code, meta) => {
    // Resolve the location value or array into an array
    let locations: TransformationLocation[];
    if (Array.isArray(locationValOrArray)) {
      locations = locationValOrArray;
    } else {
      locations = [locationValOrArray];
    }

    // Iterate the transformers for each location
    let modifiedCode = code;
    for (const location of locations) {
      for (const transformer of transformationsByLocation[location] ?? []) {
        modifiedCode = transformer(modifiedCode, meta);
      }
    }
    return modifiedCode;
  };
}
