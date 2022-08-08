import {patternPreservation} from '../builtin/transformations/patternPreservation';

export {createTransformationApplicator} from './apply';
export * from './definition';
export const builtinTransformations = {
  patternPreservationTransformation: patternPreservation
};
