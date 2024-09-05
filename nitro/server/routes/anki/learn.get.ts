import { Client } from '@notionhq/client'
import type { Component } from 'json-component-spec'
import { NotionEXClient } from 'notion-ex'
import { factory } from '~~/utils/Factory'

export default eventHandler(async (event) => {
  const NOTION_API_KEY = await factory.getParameter(
    `/internal/web/${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}/notion/default/secret`
  )

  const id = await factory.getParameter(
    '/internal/general/common/notion/database/anki/id'
  )

  const client = new Client({ auth: NOTION_API_KEY })

  const exclient = new NotionEXClient(client)

  const pages = await client.databases.query({
    database_id: id,
    page_size: 1,
    sorts: [{ property: 'nextReviewAt', direction: 'ascending' }]
  })

  const [page] = pages.results

  const pageId = page.id

  const { components: blocks } = await exclient.getDOMJSONFromBlockId(pageId)

  let section = 0

  const frontBlocks: Component[] = []
  const backBlocks: Component[] = []
  const explanationBlocks: Component[] = []

  for (const block of blocks) {
    if (block.component === 'heading' && block.heading.level === 2) section++

    switch (section) {
      case 1: {
        frontBlocks.push(block)
        break
      }

      case 2: {
        backBlocks.push(block)
        break
      }

      case 3: {
        explanationBlocks.push(block)
        break
      }

      default: {
        break
      }
    }
  }

  if (
    'properties' in page &&
    page.object === 'page' &&
    'title' in page.properties &&
    page.properties.title.type === 'rich_text' &&
    'tags' in page.properties &&
    page.properties.tags.type === 'multi_select' &&
    'nextReviewAt' in page.properties &&
    page.properties.nextReviewAt.type === 'date' &&
    'easeFactor' in page.properties &&
    page.properties.easeFactor.type === 'number' &&
    'repetitionCount' in page.properties &&
    page.properties.repetitionCount.type === 'number'
  ) {
    return {
      id: pageId,
      front: frontBlocks.slice(1),
      back: backBlocks.slice(1),
      explanation: explanationBlocks.slice(1),
      title: page.properties.title.rich_text.map((r) => r.plain_text).join(''),
      tags: page.properties.tags.multi_select,
      nextReviewAt: page.properties.nextReviewAt.date.start,
      easeFactor: page.properties.easeFactor.number,
      repetitionCount: page.properties.repetitionCount.number,
      createdAt: page.created_time,
      updatedAt: page.last_edited_time,
      url: page.url
    }
  } else {
    throw new Error('Invalid schema')
  }
})
