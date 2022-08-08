import {SkipTest} from '../../remarkTypescript';

interface Options {
  /**
   * Wrapper component name
   * @example CodeBlock
   */
  wrapperComponent: string;
}

interface JSXNode {
  type: 'jsx';
  value: string;
}

/**
 * Determines if a code blocked is wrapped in a particular react component. Useful for MDX
 */
export const isWrapped: (options: Options) => SkipTest = ({
  wrapperComponent
}: Options) => (_, parent, index) => {
  const prevNode = parent.children[index - 1];
  const nextNode = parent.children[index + 1];

  if (!prevNode || !nextNode) {
    return false;
  }

  for (const node of [prevNode, nextNode]) {
    if (node.type !== 'jsx') {
      return false;
    }
  }

  if (
    (prevNode as JSXNode).value !== `<${wrapperComponent}>` ||
    (nextNode as JSXNode).value !== `</${wrapperComponent}>`
  ) {
    return false;
  }

  return true;
};
