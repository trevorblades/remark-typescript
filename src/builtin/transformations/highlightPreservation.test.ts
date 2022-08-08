import remark from 'remark';
import {highlightPreservation} from './highlightPreservation';
import {outdent} from 'outdent';
import {remarkTypescript} from '../../remarkTypescript';

describe('Highlight Transformation', () => {
  test('keeps simple highlighting', (): void => {
    const ts = outdent`
      \`\`\`ts {1}
      () => {};
      \`\`\`
    `;
    const result = remark()
      .use(remarkTypescript, {
        customTransformations: [highlightPreservation()]
      })
      .processSync(ts)
      .toString();

    expect(result).toEqual(
      outdent`
        \`\`\`ts
        () => {}; // highlight-line
        \`\`\`
  
        \`\`\`js
        () => {}; // highlight-line
        \`\`\`

      `
    );
  });
  test('retains highlighted lines during transpilation loss', (): void => {
    const ts = outdent`
      \`\`\`ts {2}
      type Result = void;
      (): Result => {};
      \`\`\`
    `;
    const result = remark()
      .use(remarkTypescript, {
        customTransformations: [highlightPreservation()]
      })
      .processSync(ts)
      .toString();

    expect(result).toEqual(
      outdent`
        \`\`\`ts
        type Result = void;
        (): Result => {}; // highlight-line
        \`\`\`
  
        \`\`\`js
        () => {}; // highlight-line
        \`\`\`

      `
    );
  });
  test('properly handles extraneous highlighting', () => {
    const ts = outdent`
      \`\`\`ts {1-2}
      type Result = void;
      (): Result => {};
      \`\`\`
    `;
    const result = remark()
      .use(remarkTypescript, {
        customTransformations: [highlightPreservation()]
      })
      .processSync(ts)
      .toString();

    expect(result).toEqual(
      outdent`
        \`\`\`ts
        type Result = void; // highlight-line
        (): Result => {}; // highlight-line
        \`\`\`

        \`\`\`js
        () => {}; // highlight-line
        \`\`\`

      `
    );
  });
});
