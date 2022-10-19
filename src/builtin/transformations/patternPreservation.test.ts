import remark from 'remark';
import {outdent} from 'outdent';
import {patternPreservation} from './patternPreservation';
import {remarkTypescript} from '../../remarkTypescript';

describe('Pattern Preservation', () => {
  test("Assure extra comments aren't added to commented preservation lines", () => {
    const code = outdent`
      \`\`\`ts
      import { ApolloServer } from '@apollo/server'; // preserve-line
      import { startStandaloneServer } from '@apollo/server/standalone'; // preserve-line
      \`\`\`
    `;
    const result = remark()
      .use(remarkTypescript, {
        customTransformations: [patternPreservation()]
      })
      .processSync(code)
      .toString();

    expect(result).toEqual(
      outdent`
        \`\`\`ts
        import { ApolloServer } from "@apollo/server";
        import { startStandaloneServer } from "@apollo/server/standalone";
        \`\`\`

        \`\`\`js
        import { ApolloServer } from "@apollo/server";
        import { startStandaloneServer } from "@apollo/server/standalone";
        \`\`\`
        
      `
    );
  });
});
