import { Client } from '@notionhq/client'
import { factory } from '~~/utils/Factory'

export default eventHandler(async (event) => {
  const NOTION_API_KEY = await factory.getParameter(
    `/internal/web/${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}/notion/default/secret`
  )

  // const notion = new NotionClient({ NOTION_API_KEY, stdTTL: 0 })

  const client = new Client({ auth: NOTION_API_KEY })

  const id = await factory.getParameter(
    '/internal/general/common/notion/database/anki/id'
  )

  const { results } = await client.databases.query({
    database_id: id,
    filter: {
      or: [
        { property: 'nextReviewAt', date: { before: new Date().toISOString() } }
      ]
    }
  })

  return { count: results.length }
})
