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
  }>({
    id,
    page_size: 1,
    recursive: false,
    sorts: [s.ascending('nextReviewAt')]
  })

  const { properties } = results[0]

  const blocks = await notion.blocks.children({ id: results[0].id })

  const front = await notion.blocks.getDOMJSON({ id: blocks.results[0].id })
  const back = await notion.blocks.getDOMJSON({ id: blocks.results[1].id })
  const explanation = await notion.blocks.getDOMJSON({
    id: blocks.results[2].id
  })

  return { ...properties, front, back, explanation }
})
