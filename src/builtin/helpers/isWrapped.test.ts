import {Code} from 'mdast';
import {isWrapped} from './isWrapped';

function createCodeNode(code: string): Code {
  return {
    type: 'code',
    lang: 'ts',
    value: code
  };
}

function createJSXNode(component: string, state: 'OPENING' | 'CLOSING') {
  return {
    type: 'jsx',
    value: `<${state === 'CLOSING' ? '/' : ''}${component}>`
  };
}

function createTree<T>(children: T[]) {
  return {
    type: 'foo',
    children
  };
}

describe('Wrapping Component Check', () => {
  test('detects wrapped code block', () => {
    const node = createCodeNode('const test = true');
    const tree = createTree([
      createJSXNode('CodeBlock', 'OPENING'),
      node,
      createJSXNode('CodeBlock', 'CLOSING')
    ]);
    const result = isWrapped({wrapperComponent: 'CodeBlock'})(node, tree, 1);
    expect(result).toBe(true);
  });
  test('fails partially wrapped block', () => {
    const node = createCodeNode('const test = true');
    const tree = createTree([
      createJSXNode('CodeBlock', 'OPENING'),
      node,
      createJSXNode('CodeBlockInner', 'OPENING')
    ]);
    const result = isWrapped({wrapperComponent: 'CodeBlock'})(node, tree, 1);
    expect(result).toBe(false);
  });
  test('fails unwrapped block', () => {
    const node = createCodeNode('const test = true');
    const tree = createTree([node]);
    const result = isWrapped({wrapperComponent: 'CodeBlock'})(node, tree, 1);
    expect(result).toBe(false);
  });
});
