import { Client } from '@notionhq/client'
import { factory } from '~~/utils/Factory'

export default eventHandler(async (event) => {
  const NOTION_API_KEY = await factory.getParameter(
    `/internal/web/${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}/notion/default/secret`
  )

  const client = new Client({ auth: NOTION_API_KEY })

  const body = await readBody(event)

  if (
    'id' in body &&
    'nextReviewAt' in body &&
    'repetitionCount' in body &&
    'easeFactor' in body
  ) {
    const res = await client.pages.update({
      page_id: body.id,
      properties: {
        nextReviewAt: { date: { start: body.nextReviewAt } },
        repetitionCount: { number: body.repetitionCount },
        easeFactor: { number: body.easeFactor }
      }
    })

    return res
  } else {
    setResponseStatus(event, 400)
    return { error: 'Required: nextReviewAt | repetitionCount | easeFactor' }
  }
})
