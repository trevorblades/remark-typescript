/* eslint-env jest */
import remarkTypescript = require('.');
import remark = require('remark');
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
