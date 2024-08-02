import { Client } from '@notionhq/client'
import {
  PageObjectResponse,
  PartialPageObjectResponse,
  PartialDatabaseObjectResponse,
  DatabaseObjectResponse
} from '@notionhq/client/build/src/api-endpoints'
import { factory } from '~~/utils/Factory'

export default eventHandler(async (event) => {
  const NOTION_API_KEY = await factory.getParameter(
    `/internal/web/${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}/notion/default/secret`
  )

  const client = new Client({ auth: NOTION_API_KEY })

  const id = await factory.getParameter(
    '/internal/general/common/notion/database/websites/id'
  )

  const rawBookmarks: (
    | PageObjectResponse
    | PartialPageObjectResponse
    | PartialDatabaseObjectResponse
    | DatabaseObjectResponse
  )[] = []

  let startCursor: string | undefined = undefined

  while (true) {
    const { results, has_more, next_cursor } = await client.databases.query({
      database_id: id,
      page_size: 100,
      start_cursor: startCursor,
      filter: { or: [{ property: 'type', select: { equals: 'Bookmark' } }] }
    })

    rawBookmarks.push(...results)

    if (has_more) {
      startCursor = next_cursor
    } else {
      break
    }
  }

  const bookmarks = rawBookmarks.map((r) => {
    if (
      r.object === 'page' &&
      'properties' in r &&
      'name' in r.properties &&
      r.properties.name.type === 'title' &&
      'url' in r.properties &&
      r.properties.url.type === 'url' &&
      'tags' in r.properties &&
      r.properties.tags.type === 'multi_select'
    ) {
      let icon: string | null = null
      if (r.icon?.type === 'file') {
        icon = r.icon.file.url
      } else if (r.icon?.type === 'external') {
        icon = r.icon.external.url
      } else if (r.icon?.type === 'emoji') {
        icon = r.icon.emoji
      }

      return {
        name: r.properties.name.title.map((t) => t.plain_text).join(''),
        url: r.properties.url.url,
        tags: r.properties.tags.multi_select,
        icon
      }
    }
  })

  return bookmarks
})
