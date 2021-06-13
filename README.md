This is a plugin for `@graphql-codegen/cli` that works like `@graphql-codegen/ast` but will more options.

## Installation

```
yarn add -D @erictaylor/graphql-codegen-schema-ast
```

## API Reference

#### `includeDirectives`

type: `boolean` default: `false`

Include directives to Schema output.

#### `includeIntrospection`

type: `boolean` default: `false`

Include introspection types to Schema output.

#### `commentDescriptions`

type: `boolean` default: `false`

Set to true in order to print description as comments (using # instead of """)

#### `sort`

type: `boolean` default: `false`

Set to true in order to get the schema lexicographically sorted before printed.

#### `federation`

type: `boolean`

## Usage

```yml
schema:
  - "./src/schema.graphql"
generates:
  path/to/file.graphql:
    plugins:
      - schema-ast
    config:
      includeDirectives: true
      includeIntrospection: true
```
