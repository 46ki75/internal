import { z } from 'zod'

export const RelayConnection = <T>(schema: z.ZodType<T>) =>
  z.object({
    edges: z.array(
      z.object({
        node: schema,
        cursor: z.string()
      })
    ),
    pageInfo: z.object({
      hasNextPage: z.boolean(),
      endCursor: z.string()
    })
  })
