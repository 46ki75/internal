import type { TypingEntity } from "~/entity/Entity";

export interface TypingRepository {
  list({ accessToken }: { accessToken: string }): Promise<TypingEntity[]>;
  upsert({
    accessToken,
    text,
    description,
  }: {
    accessToken: string;
    text: string;
    description: string;
  }): Promise<TypingEntity>;
}

export class TypingRepositoryImpl implements TypingRepository {
  async list({
    accessToken,
  }: {
    accessToken: string;
  }): Promise<TypingEntity[]> {
    const response = await $fetch<{ data: { typingList: TypingEntity[] } }>(
      "/api/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken,
        },
        body: JSON.stringify({
          query: /* GraphQL */ `
            query ListTyping {
              typingList {
                id
                text
                description
              }
            }
          `,
        }),
      }
    );

    return response.data.typingList;
  }

  async upsert({
    accessToken,
    text,
    description,
  }: {
    accessToken: string;
    text: string;
    description: string;
  }): Promise<TypingEntity> {
    const response = await $fetch<{ data: { upsertTyping: TypingEntity } }>(
      "/api/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${accessToken}`,
        },
        body: JSON.stringify({
          query: /* GraphQL */ `
            mutation CreateTyping($text: String!, $description: String!) {
              upsertTyping(input: { text: $text, description: $description }) {
                id
                text
                description
              }
            }
          `,
          variables: { text, description },
        }),
      }
    );

    return response.data.upsertTyping;
  }
}
