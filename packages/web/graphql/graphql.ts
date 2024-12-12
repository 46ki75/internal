/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A scalar that can represent any JSON value. */
  JSON: { input: any; output: any; }
};

export type Anki = {
  __typename?: 'Anki';
  blockList: AnkiBlock;
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  easeFactor: Scalars['Float']['output'];
  nextReviewAt: Scalars['String']['output'];
  pageId: Scalars['String']['output'];
  repetitionCount: Scalars['Int']['output'];
  tags: Array<AnkiTag>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type AnkiBlock = {
  __typename?: 'AnkiBlock';
  back: Scalars['JSON']['output'];
  explanation: Scalars['JSON']['output'];
  front: Scalars['JSON']['output'];
};

export type AnkiConnection = {
  __typename?: 'AnkiConnection';
  edges: Array<AnkiEdge>;
  pageInfo: PageInfo;
};

export type AnkiEdge = {
  __typename?: 'AnkiEdge';
  cursor: Scalars['String']['output'];
  node: Anki;
};

export type AnkiInput = {
  pageId: Scalars['String']['input'];
};

export type AnkiTag = {
  __typename?: 'AnkiTag';
  color: AnkiTagColor;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export enum AnkiTagColor {
  Blue = 'blue',
  Brown = 'brown',
  Default = 'default',
  Gray = 'gray',
  Green = 'green',
  Orange = 'orange',
  Pink = 'pink',
  Purple = 'purple',
  Red = 'red',
  Yellow = 'yellow'
}

export type Bookmark = {
  __typename?: 'Bookmark';
  favicon?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  tags: Array<BookmarkTag>;
  url?: Maybe<Scalars['String']['output']>;
};

export type BookmarkConnection = {
  __typename?: 'BookmarkConnection';
  edges: Array<BookmarkEdge>;
  pageInfo: PageInfo;
};

export type BookmarkEdge = {
  __typename?: 'BookmarkEdge';
  cursor: Scalars['String']['output'];
  node: Bookmark;
};

export type BookmarkListInput = {
  nextCursor?: InputMaybe<Scalars['String']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export type BookmarkTag = {
  __typename?: 'BookmarkTag';
  color: BookmarkTagColor;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export enum BookmarkTagColor {
  Blue = 'blue',
  Brown = 'brown',
  Default = 'default',
  Gray = 'gray',
  Green = 'green',
  Orange = 'orange',
  Pink = 'pink',
  Purple = 'purple',
  Red = 'red',
  Yellow = 'yellow'
}

export type CreateAnkiInput = {
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreateBookmarkInput = {
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type ListAnkiInput = {
  nextCursor?: InputMaybe<Scalars['String']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  createAnki: Anki;
  createBookmark: Bookmark;
  updateAnki: Anki;
};


export type MutationRootCreateAnkiArgs = {
  input: CreateAnkiInput;
};


export type MutationRootCreateBookmarkArgs = {
  input: CreateBookmarkInput;
};


export type MutationRootUpdateAnkiArgs = {
  input: UpdateAnkiInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  nextCursor?: Maybe<Scalars['String']['output']>;
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  anki: Anki;
  ankiList: AnkiConnection;
  bookmarkList: BookmarkConnection;
  /** Returns a greeting message along with the programming language. */
  greet: Scalars['String']['output'];
  translate: Scalars['String']['output'];
  translateUsage: TranslateUsageResponse;
};


export type QueryRootAnkiArgs = {
  input: AnkiInput;
};


export type QueryRootAnkiListArgs = {
  input?: InputMaybe<ListAnkiInput>;
};


export type QueryRootBookmarkListArgs = {
  input?: InputMaybe<BookmarkListInput>;
};


export type QueryRootTranslateArgs = {
  input: TranslateInput;
};

/** [DeepL Docs](https://developers.deepl.com/docs/resources/supported-languages#source-languages) */
export enum SourceLang {
  En = 'EN',
  Ja = 'JA'
}

/** [DeepL Docs](https://developers.deepl.com/docs/resources/supported-languages#target-languages) */
export enum TargetLang {
  En = 'EN',
  Ja = 'JA'
}

export type TranslateInput = {
  sourceLang: SourceLang;
  targetLang: TargetLang;
  text: Scalars['String']['input'];
};

export type TranslateUsageResponse = {
  __typename?: 'TranslateUsageResponse';
  characterCount: Scalars['Int']['output'];
  characterLimit: Scalars['Int']['output'];
};

export type UpdateAnkiInput = {
  easeFactor: Scalars['Float']['input'];
  nextReviewAt: Scalars['String']['input'];
  pageId: Scalars['String']['input'];
  repetitionCount: Scalars['Int']['input'];
};

export type BookmarkQueryVariables = Exact<{ [key: string]: never; }>;


export type BookmarkQuery = { __typename?: 'QueryRoot', bookmarkList: { __typename?: 'BookmarkConnection', edges: Array<{ __typename?: 'BookmarkEdge', cursor: string, node: { __typename?: 'Bookmark', id: string, name?: string | null, url?: string | null, favicon?: string | null, tags: Array<{ __typename?: 'BookmarkTag', id: string, name: string, color: BookmarkTagColor }> } }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, nextCursor?: string | null } } };

export type SampleQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type SampleQueryQuery = { __typename?: 'QueryRoot', greet: string };

export type TranslateQueryVariables = Exact<{
  text: Scalars['String']['input'];
  sourceLang: SourceLang;
  targetLang: TargetLang;
}>;


export type TranslateQuery = { __typename?: 'QueryRoot', translate: string };


export const BookmarkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Bookmark"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bookmarkList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"IntValue","value":"100"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"favicon"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]}}]} as unknown as DocumentNode<BookmarkQuery, BookmarkQueryVariables>;
export const SampleQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SampleQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"greet"}}]}}]} as unknown as DocumentNode<SampleQueryQuery, SampleQueryQueryVariables>;
export const TranslateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Translate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"text"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sourceLang"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SourceLang"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"targetLang"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TargetLang"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"translate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"text"},"value":{"kind":"Variable","name":{"kind":"Name","value":"text"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"sourceLang"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sourceLang"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"targetLang"},"value":{"kind":"Variable","name":{"kind":"Name","value":"targetLang"}}}]}}]}]}}]} as unknown as DocumentNode<TranslateQuery, TranslateQueryVariables>;