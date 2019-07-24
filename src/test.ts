/* eslint-env jest */
import visitor = require('.');
import {code, root} from 'mdast-builder';

test('transpiles TS code blocks', (): void => {
  const ts = code('ts', '(): void => {}');
  const mdast = visitor({markdownAST: root([ts])});
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
