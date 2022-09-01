import {Transformation} from '../../custom-transformations/definition';

/**
 * Keeps lines that contain "// preserve-line" throughout the babel transpilation.
 * Otherwise, some lines might be deleted that are unused.
 * @returns Custom transformation
 */
export function patternPreservation(): () => Transformation {
  // Preservation pattern
  const PRESERVE_PATTERN = /\s*\/\/\s*preserve-line/;
  const COMMENT_PATTERN = /^\W*\/\/\s/;
  return () => ({
    code: {
      beforeTranspile(code) {
        // Any line that needs preservation will be commented out
        return code
          .split('\n')
          .map(line => {
            if (PRESERVE_PATTERN.test(line)) {
              return '// ' + line;
            }
            return line;
          })
          .join('\n');
      },
      beforeFormat(code) {
        // Undo the commenting out be deleting the "// " on lines that match the pattern preservation
        return code
          .split('\n')
          .map(line => {
            if (PRESERVE_PATTERN.test(line)) {
              return line
                .replace(COMMENT_PATTERN, '')
                .replace(PRESERVE_PATTERN, '');
            }
            return line;
          })
          .join('\n');
      }
    }
  });
}
