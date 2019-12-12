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
            import gql from 'graphql-tag';
            import {ApolloClient} from 'apollo-client'; // preserve-line

            export const typeDefs = gql\`
              type Query {
                posts: [Post]
              }
            \`;
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
          import gql from 'graphql-tag';
          import {ApolloClient} from 'apollo-client';

          export const typeDefs = gql\`
            type Query {
              posts: [Post]
            }
          \`;
        `
      ),
      code(
        'js',
        outdent`
          import gql from 'graphql-tag';
          import { ApolloClient } from 'apollo-client';

          export const typeDefs = gql\`
            type Query {
              posts: [Post]
            }
          \`;
        `
      )
    ])
  );
});
