import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { Client } from '@notionhq/client'
import { type Component } from 'json-component-spec'
import { NotionEXClient } from 'notion-ex'

interface Payload {
  block_id: string
}

export const handler = async (
  event: Payload
): Promise<{
  front: Component[]
  back: Component[]
  explanation: Component[]
}> => {
  const ssm = new SSMClient()
  const res = await ssm.send(
    new GetParameterCommand({
      Name: '/internal/web/prod/notion/default/secret',
      WithDecryption: true
    })
  )

  const NOTION_API_KEY = res.Parameter?.Value

  const client = new Client({ auth: NOTION_API_KEY })
  const notion = new NotionEXClient(client)

  const blocks = await notion.getDOMJSONFromBlockId(event.block_id, {
    enableChildPage: true,
    enableLinkPageRef: true,
    enableSyncedBlock: true
  })

  // # --------------------------------------------------------------------------------
  //
  //
  //
  // # --------------------------------------------------------------------------------

  let section = 0

  const frontBlocks: Component[] = []
  const backBlocks: Component[] = []
  const explanationBlocks: Component[] = []

  for (const block of blocks) {
    if (block.component === 'heading' && block.heading.level === 1) section++

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

  return {
    front: frontBlocks,
    back: backBlocks,
    explanation: explanationBlocks
  }
}
