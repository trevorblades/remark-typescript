/**
 * Iterator helper that allows easy iteration of defined values
 * @param iter Iterable with nullish values
 */
export function* iterateDefined<T>(
  iter: Iterable<T | null | undefined>
): Generator<T> {
  for (const val of iter) {
    if (val !== undefined && val !== null) {
      yield val;
    }
  }
}

/**
 * Iterates over an array or a single value. Useful for properties that are either single values or arrays
 * @param iterOrVal Single item or iterable to use
 */
export function* iterateArrayOrVal<T>(
  iterOrVal: Iterable<T> | T
): Generator<T> {
  if (
    typeof iterOrVal === 'object' &&
    typeof (iterOrVal as Iterable<T>)[Symbol.iterator] === 'function'
  ) {
    for (const val of iterOrVal as Iterable<T>) {
      yield val;
    }
    return;
  }
  yield iterOrVal as T;
}
