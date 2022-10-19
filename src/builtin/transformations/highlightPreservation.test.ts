import remark from 'remark';
import {highlightPreservation} from './highlightPreservation';
import {outdent} from 'outdent';
import {remarkTypescript} from '../../remarkTypescript';

describe('Highlight Transformation', () => {
  test('keeps simple highlighting', (): void => {
    const ts = outdent`
      \`\`\`ts {1,2}
      () => {};
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
        /* highlight-line */() => {};
        /* highlight-line */() => {};
        \`\`\`
  
        \`\`\`js
        /* highlight-line */ () => {};
        /* highlight-line */ () => {};
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
        /* highlight-line */(): Result => {};
        \`\`\`
  
        \`\`\`js
        /* highlight-line */ () => {};
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
        /* highlight-line */type Result = void;
        /* highlight-line */(): Result => {};
        \`\`\`

        \`\`\`js
        /* highlight-line */ () => {};
        \`\`\`

      `
    );
  });
  test('disposes of extra empty lines remaining from missing TS highlights', () => {
    const ts = outdent`
      \`\`\`ts {3-5}
      const foo = "bar";

      interface Foo {
        foo: string;
      }

      (): void => {};
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
        const foo = "bar";

        /* highlight-line */interface Foo {
        /* highlight-line */  foo: string;
        /* highlight-line */}
  
        (): void => {};
        \`\`\`

        \`\`\`js
        const foo = "bar";

        () => {};
        \`\`\`

      `
    );
  });
});
