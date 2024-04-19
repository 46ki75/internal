import {
  DatePageProperty,
  MultiSelectPageProperty,
  NotionClient,
  NumberPageProperty,
  RichTextPageProperty,
  TitlePageProperty,
  s
} from 'notion-markup-utils'
import { factory } from '~~/utils/Factory'

export default eventHandler(async (event) => {
  const NOTION_API_KEY = await factory.getParameter(
    `/internal/web/${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}/notion/default/secret`
  )

  const notion = new NotionClient({ NOTION_API_KEY, stdTTL: 0 })

  const id = await factory.getParameter(
    '/internal/general/common/notion/database/anki/id'
  )

  const { results } = await notion.databases.query<{
    page: TitlePageProperty
    title: RichTextPageProperty
    tags: MultiSelectPageProperty
    nextReviewAt: DatePageProperty
    repetitionCount: NumberPageProperty
    easeFactor: NumberPageProperty
    updatedAt: DatePageProperty
    createdAt: DatePageProperty
  }>({ id, sorts: [s.ascending('nextReviewAt')], page_size: 100 })

  let shouldLearn = 0
  for (const result of results) {
    if (new Date(result.properties.nextReviewAt.date.start) > new Date()) {
      break
    } else {
      shouldLearn++
    }
  }

  return { all: results.length, shouldLearn }
})
