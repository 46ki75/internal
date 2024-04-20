import {
  DatePageProperty,
  MultiSelectPageProperty,
  NotionClient,
  NumberPageProperty,
  RichTextPageProperty,
  TitlePageProperty,
  p
} from 'notion-markup-utils'
import { factory } from '~~/utils/Factory'

export default eventHandler(async (event) => {
  const NOTION_API_KEY = await factory.getParameter(
    `/internal/web/${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}/notion/default/secret`
  )

  const notion = new NotionClient({ NOTION_API_KEY, stdTTL: 0 })

  const body = await readBody(event)

  if (
    'id' in body &&
    'nextReviewAt' in body &&
    'repetitionCount' in body &&
    'easeFactor' in body
  ) {
    const res = await notion.pages.update<{
      page: TitlePageProperty
      title: RichTextPageProperty
      tags: MultiSelectPageProperty
      nextReviewAt: DatePageProperty
      repetitionCount: NumberPageProperty
      easeFactor: NumberPageProperty
      updatedAt: DatePageProperty
      createdAt: DatePageProperty
    }>({
      page_id: body.id,
      properties: {
        nextReviewAt: p.date(body.nextReviewAt),
        repetitionCount: p.number(body.repetitionCount),
        easeFactor: p.number(body.easeFactor)
      }
    })

    return res
  } else {
    setResponseStatus(event, 400)
    return { error: 'Required: nextReviewAt | repetitionCount | easeFactor' }
  }
})
