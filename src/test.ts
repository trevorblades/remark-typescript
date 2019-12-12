/* eslint-env jest */
import plugin = require('.');
import {code, root} from 'mdast-builder';
import {outdent} from 'outdent';

test('transforms TS code blocks', (): void => {
  const ts = code('ts', '(): void => {}');
  const mdast = plugin({markdownAST: root([ts])});
  expect(mdast).toEqual(root([ts, code('js', '() => {};')]));
});

test('preserves code block titles', (): void => {
  const ts = code('tsx:title=src/index.tsx', '(): void => {}');
  const mdast = plugin({markdownAST: root([ts])});
  expect(mdast).toEqual(
    root([ts, code('jsx:title=src/index.jsx', '() => {};')])
  );
});

test('preserves tagged unused imports', (): void => {
  const mdast = plugin(
    {
      markdownAST: root([
        code(
          'ts',
          outdent`
            import { ApolloServer } from 'apollo-server';
            import typeDefs from './schema';
            import preserved from 'preserved'; // preserve-line
            import notPreserved from 'not-preserved';

            const server = new ApolloServer({ typeDefs });
          `
        )
      ])
    },
    {
      prettierOptions: {
        singleQuote: true
      }
    }
  );

  expect(mdast).toEqual(
    root([
      code(
        'ts',
        outdent`
          import { ApolloServer } from 'apollo-server';
          import typeDefs from './schema';
          import preserved from 'preserved';
          import notPreserved from 'not-preserved';

          const server = new ApolloServer({ typeDefs });
        `
      ),
      code(
        'js',
        outdent`
          import { ApolloServer } from 'apollo-server';
          import typeDefs from './schema';
          import preserved from 'preserved';

          const server = new ApolloServer({ typeDefs });
        `
      )
    ])
  );
});
