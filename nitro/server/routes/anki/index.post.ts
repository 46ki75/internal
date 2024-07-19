import { Client } from '@notionhq/client'

import { factory } from '~~/utils/Factory'

export default eventHandler(async (event) => {
  const NOTION_API_KEY = await factory.getParameter(
    `/internal/web/${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}/notion/default/secret`
  )

  const notion = new Client({ auth: NOTION_API_KEY })

  const id = await factory.getParameter(
    '/internal/general/common/notion/database/anki/id'
  )
  const response = await notion.pages.create({
    parent: {
      type: 'database_id',
      database_id: id
    },
    properties: {
      easeFactor: {
        type: 'number',
        number: 2.5
      },
      repetitionCount: {
        type: 'number',
        number: 0
      },
      nextReviewAt: {
        type: 'date',
        date: {
          start: new Date().toISOString(),
          end: null,
          time_zone: null
        }
      }
    },
    children: [
      {
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'front'
              },
              annotations: { color: 'brown' }
            }
          ]
        }
      },
      {
        paragraph: { rich_text: [] }
      },
      {
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'back'
              },
              annotations: { color: 'brown' }
            }
          ]
        }
      },
      {
        paragraph: { rich_text: [] }
      },
      {
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: 'explanation'
              },
              annotations: { color: 'brown' }
            }
          ]
        }
      },
      {
        paragraph: { rich_text: [] }
      }
    ]
  })
  return { url: (response as any).url }
})
