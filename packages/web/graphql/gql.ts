/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "\n  query Bookmark {\n    bookmarkList(input: { pageSize: 100 }) {\n      edges {\n        node {\n          id\n          name\n          url\n          favicon\n          tags {\n            id\n            name\n            color\n          }\n        }\n        cursor\n      }\n      pageInfo {\n        hasNextPage\n        nextCursor\n      }\n    }\n  }\n": types.BookmarkDocument,
    "\n  query SampleQuery {\n    greet\n  }\n": types.SampleQueryDocument,
    "\n  query Translate(\n    $text: String!\n    $sourceLang: SourceLang!\n    $targetLang: TargetLang!\n  ) {\n    translate(\n      input: { text: $text, sourceLang: $sourceLang, targetLang: $targetLang }\n    )\n  }\n": types.TranslateDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Bookmark {\n    bookmarkList(input: { pageSize: 100 }) {\n      edges {\n        node {\n          id\n          name\n          url\n          favicon\n          tags {\n            id\n            name\n            color\n          }\n        }\n        cursor\n      }\n      pageInfo {\n        hasNextPage\n        nextCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query Bookmark {\n    bookmarkList(input: { pageSize: 100 }) {\n      edges {\n        node {\n          id\n          name\n          url\n          favicon\n          tags {\n            id\n            name\n            color\n          }\n        }\n        cursor\n      }\n      pageInfo {\n        hasNextPage\n        nextCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SampleQuery {\n    greet\n  }\n"): (typeof documents)["\n  query SampleQuery {\n    greet\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Translate(\n    $text: String!\n    $sourceLang: SourceLang!\n    $targetLang: TargetLang!\n  ) {\n    translate(\n      input: { text: $text, sourceLang: $sourceLang, targetLang: $targetLang }\n    )\n  }\n"): (typeof documents)["\n  query Translate(\n    $text: String!\n    $sourceLang: SourceLang!\n    $targetLang: TargetLang!\n  ) {\n    translate(\n      input: { text: $text, sourceLang: $sourceLang, targetLang: $targetLang }\n    )\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;