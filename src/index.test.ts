/* eslint-env jest */
import remark from 'remark';
import remarkTypescript from './index';
import {Code} from 'mdast';
import {outdent} from 'outdent';

test('transforms TS code blocks', (): void => {
  const ts = outdent`
    \`\`\`ts
    (): void => { }
    \`\`\`
  `;
  expect(
    remark()
      .use(remarkTypescript)
      .processSync(ts)
      .toString()
  ).toEqual(
    outdent`
      ${ts}

      \`\`\`js
      () => {};
      \`\`\`

    `
  );
});

test('preserves code block titles', (): void => {
  const ts = outdent`
    \`\`\`tsx:title=src/index.tsx
    (): void => { }
    \`\`\`
  `;
  expect(
    remark()
      .use(remarkTypescript)
      .processSync(ts)
      .toString()
  ).toEqual(
    outdent`
      ${ts}

      \`\`\`jsx:title=src/index.jsx
      () => {};
      \`\`\`

    `
  );
});

test('preserves metastring', (): void => {
  const ts = outdent`
    \`\`\`tsx title="src/index.tsx"
    (): void => { }
    \`\`\`
  `;
  expect(
    remark()
      .use(remarkTypescript)
      .processSync(ts)
      .toString()
  ).toEqual(
    outdent`
      ${ts}

      \`\`\`jsx title="src/index.jsx"
      () => {};
      \`\`\`

    `
  );
});

test('preserves tagged unused imports', (): void => {
  const ts = outdent`
    \`\`\`ts
    import { ApolloServer } from 'apollo-server';
    import typeDefs from './schema';
    import preserved from 'preserved'; // preserve-line
    import notPreserved from 'not-preserved';

    const server = new ApolloServer({ typeDefs });
    \`\`\`
  `;

  expect(
    remark()
      .use(remarkTypescript, {
        prettierOptions: {
          singleQuote: true
        }
      })
      .processSync(ts)
      .toString()
  ).toEqual(
    outdent`
      \`\`\`ts
      import { ApolloServer } from 'apollo-server';
      import typeDefs from './schema';
      import preserved from 'preserved';
      import notPreserved from 'not-preserved';

      const server = new ApolloServer({ typeDefs });
      \`\`\`

      \`\`\`js
      import { ApolloServer } from 'apollo-server';
      import typeDefs from './schema';
      import preserved from 'preserved';

      const server = new ApolloServer({ typeDefs });
      \`\`\`

    `
  );
});

test('tests the skipping parameter', (): void => {
  const ts = outdent`
    \`\`\`ts
    (): void => { }
    \`\`\`

    \`\`\`ts no-transpile
    (): void => { }
    \`\`\`

    \`\`\`ts
    (): void => { }
    \`\`\`
  `;
  const result = remark()
    .use(remarkTypescript, {
      shouldSkip(_, parent, index, meta) {
        if (meta?.includes('no-transpile')) {
          return true;
        }
        const nextNode = parent.children[index + 1] as Code | undefined;
        if (nextNode && nextNode.lang === 'ts') {
          return true;
        }
        return false;
      }
    })
    .processSync(ts)
    .toString();

  expect(result).toEqual(
    outdent`
      ${ts}

      \`\`\`js
      () => {};
      \`\`\`

    `
  );
});
