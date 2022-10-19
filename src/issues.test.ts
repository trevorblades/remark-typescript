import remark from 'remark';
import {highlightPreservation} from './builtin/transformations/highlightPreservation';
import {outdent} from 'outdent';
import {remarkTypescript} from './remarkTypescript';

describe('Issue with long highlighted lines', () => {
  test('should not place the highlight on the following line during formatting', () => {
    const ts = outdent`
      \`\`\`ts
      import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';
      import { ApolloServer } from 'apollo-server';

      class MoviesAPI extends RESTDataSource { //highlight-line
        override baseURL: string = 'https://movies-api.example.com/';

        override willSendRequest(request: RequestOptions) {
          request.headers.set('Authorization', this.context.token);
        }

        async getMovie(id: string): Promise<Movie> {
          return this.get<Movie>(\`movies/\${encodeURIComponent(id)}\`);
        }
      }

      interface ContextValue {
        token: string;
        dataSources: {
          moviesAPI: MoviesAPI;
        }
      };

      const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req: ExpressRequest }): Omit<ContextValue, 'dataSources'> => { //highlight-line
          return {
            token: getTokenFromRequest(req),
          };
        },
        //highlight-start
        dataSources: (): ContextValue['dataSources'] => {
          return {
            moviesAPI: new MoviesAPI(),
          };
        },
        //highlight-end
      });

      await server.listen();
      \`\`\`
    `;

    const result = remark()
      .use(remarkTypescript, {
        customTransformations: [highlightPreservation()]
      })
      .processSync(ts)
      .toString();

    expect(result).toBe(outdent`
      \`\`\`ts
      import { RESTDataSource, RequestOptions } from "apollo-datasource-rest";
      import { ApolloServer } from "apollo-server";

      /* highlight-line */ class MoviesAPI extends RESTDataSource {
        override baseURL: string = "https://movies-api.example.com/";

        override willSendRequest(request: RequestOptions) {
          request.headers.set("Authorization", this.context.token);
        }

        async getMovie(id: string): Promise<Movie> {
          return this.get<Movie>(\`movies/\${encodeURIComponent(id)}\`);
        }
      }

      interface ContextValue {
        token: string;
        dataSources: {
          moviesAPI: MoviesAPI;
        };
      }

      const server = new ApolloServer({
        typeDefs,
        resolvers,
        /* highlight-line */ context: ({ req: ExpressRequest }): Omit<ContextValue, "dataSources"> => {
          return {
            token: getTokenFromRequest(req),
          };
        },
        //highlight-start
        dataSources: (): ContextValue["dataSources"] => {
          return {
            moviesAPI: new MoviesAPI(),
          };
        },
        //highlight-end
      });

      await server.listen();
      \`\`\`

      \`\`\`js
      import { RESTDataSource } from "apollo-datasource-rest";
      import { ApolloServer } from "apollo-server";

      /* highlight-line */ class MoviesAPI extends RESTDataSource {
        baseURL = "https://movies-api.example.com/";

        willSendRequest(request) {
          request.headers.set("Authorization", this.context.token);
        }

        async getMovie(id) {
          return this.get(\`movies/\${encodeURIComponent(id)}\`);
        }
      }

      const server = new ApolloServer({
        typeDefs,
        resolvers,
        /* highlight-line */ context: ({ req: ExpressRequest }) => {
          return {
            token: getTokenFromRequest(req),
          };
        },
        //highlight-start
        dataSources: () => {
          return {
            moviesAPI: new MoviesAPI(),
          };
        },
        //highlight-end
      });

      await server.listen();
      \`\`\`

    `);
  });
});
