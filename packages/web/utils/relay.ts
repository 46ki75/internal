import { z } from "zod";

export const relayConnectionSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    edges: z.array(
      z.object({
        node: schema,
        cursor: z.string(),
      }),
    ),
    pageInfo: z.object({
      hasNextPage: z.boolean().optional().nullable(),
      hasPreviousPage: z.boolean().optional().nullable(),
      startCursor: z.string().optional().nullable(),
      endCursor: z.string().optional().nullable(),
      nextCursor: z.string().optional().nullable(),
    }),
  });
