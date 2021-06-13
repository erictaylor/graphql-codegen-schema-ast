import {
  PluginFunction,
  PluginValidateFn,
  removeFederation,
  Types,
} from "@graphql-codegen/plugin-helpers";
import {
  extendSchema,
  printIntrospectionSchema,
  parse,
  GraphQLSchema,
  lexicographicSortSchema,
  printSchema,
  visit,
  buildASTSchema,
} from "graphql";
import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { extname } from "path";

/**
 * @description This plugin prints the merged schema as string. If multiple schemas are provided, they will be merged and printed as one schema.
 */
export interface SchemaASTConfig {
  /**
   * @description Set to true in order to print description as comments (using # instead of """)
   * @default false
   *
   * @exampleMarkdown
   * ```yml
   * schema: http://localhost:3000/graphql
   * generates:
   *   schema.graphql:
   *     plugins:
   *       - schema-ast
   *     config:
   *       commentDescriptions: true
   * ```
   */
  commentDescriptions?: boolean;
  /**
   * @description Include directives to Schema output.
   * @default false
   *
   * @exampleMarkdown
   * ```yml
   * schema:
   *   - './src/schema.graphql'
   * generates:
   *   path/to/file.graphql:
   *     plugins:
   *       - schema-ast
   *     config:
   *       includeDirectives: true
   * ```
   */
  includeDirectives?: boolean;
  /**
   * @description Include introspection types to Schema output.
   * @default false
   *
   * @exampleMarkdown
   * ```yml
   * schema:
   *   - './src/schema.graphql'
   * generates:
   *   path/to/file.graphql:
   *     plugins:
   *       - schema-ast
   *     config:
   *       includeIntrospection: true
   * ```
   */
  includeIntrospection?: boolean;
  /**
   * @description Set to true in order get the schema lexicographically sorted before printed.
   * @default false
   */
  sort?: boolean;
  federation?: boolean;
}

export const plugin: PluginFunction<SchemaASTConfig> = async (
  schema,
  _documents,
  {
    commentDescriptions = false,
    includeDirectives = false,
    includeIntrospection = false,
    sort = false,
    federation,
  }
): Promise<string> => {
  let outputSchema = federation ? removeFederation(schema) : schema;

  if (includeIntrospection) {
    // See: https://spec.graphql.org/June2018/#sec-Schema-Introspection
    const introspectionAST = parse(`
      extend type Query {
        __schema: __Schema!
        __type(name: String!): __Type
      }
    `);

    outputSchema = extendSchema(outputSchema, introspectionAST);
  }

  outputSchema = sort ? lexicographicSortSchema(outputSchema) : outputSchema;

  return [
    includeIntrospection
      ? printIntrospectionSchema(outputSchema, { commentDescriptions })
      : null,
    includeDirectives
      ? printSchemaWithDirectives(outputSchema, { commentDescriptions })
      : printSchema(outputSchema, { commentDescriptions }),
  ]
    .filter(Boolean)
    .join("\n");
};

export const validate: PluginValidateFn = async (
  _schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  _config: SchemaASTConfig,
  outputFile: string,
  allPlugins: Types.ConfiguredPlugin[]
): Promise<void> => {
  const singlePlugin = allPlugins.length === 1;

  if (singlePlugin && extname(outputFile) !== ".graphql") {
    throw new Error(
      `Plugin "@erictaylor/graphql-codegen-schema-ast" requires extension to be ".graphql"!`
    );
  }
};

export function transformSchemaAST(
  schema: GraphQLSchema,
  config: { [key: string]: any }
) {
  const printedSchema = printSchema(schema);
  const astNode = parse(printedSchema);

  const transformedAST = config["disableDescriptions"]
    ? visit(astNode, {
        leave: (node) => ({
          ...node,
          description: undefined,
        }),
      })
    : astNode;

  const transformedSchema = config["disableDescriptions"]
    ? buildASTSchema(transformedAST)
    : schema;

  return {
    schema: transformedSchema,
    ast: transformedAST,
  };
}
