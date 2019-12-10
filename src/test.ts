/* eslint-env jest */
import plugin = require('.');
import {code, root} from 'mdast-builder';

test('transforms TS code blocks', (): void => {
  const ts = code('ts', '(): void => {}');
  const mdast = plugin({markdownAST: root([ts])});
  expect(mdast).toEqual({
    type: 'root',
    children: [
      ts,
      {
        type: 'code',
        lang: 'js',
        value: '() => {};'
      }
    ]
  });
});

test('preserves code block titles', (): void => {
  const ts = code('tsx:title=src/index.tsx', '(): void => {}');
  const mdast = plugin({markdownAST: root([ts])});
  expect(mdast).toEqual({
    type: 'root',
    children: [
      ts,
      {
        type: 'code',
        lang: 'jsx:title=src/index.jsx',
        value: '() => {};'
      }
    ]
  });
});
