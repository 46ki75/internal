import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { Client } from '@notionhq/client'
import { DOMJSON, NotionEXClient } from 'notion-ex'

interface Payload {
  block_id: string
}

export const handler = async (
  event: Payload
): Promise<{ front: DOMJSON[]; back: DOMJSON[]; explanation: DOMJSON[] }> => {
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

  const result = await notion.getDOMJSONFromBlockId(event.block_id, {
    enableChildPage: true,
    enableLinkPageRef: true,
    enableSyncedBlock: true
  })

  // # --------------------------------------------------------------------------------
  //
  //
  //
  // # --------------------------------------------------------------------------------

  const blocks = result

  let section: string = 'none'
  const front: DOMJSON[] = []
  const back: DOMJSON[] = []
  const explanation: DOMJSON[] = []

  for (const block of blocks) {
    if (block.type === 'heading_1' && block.content.includes('front')) {
      section = 'front'
      continue
    } else if (block.type === 'heading_1' && block.content.includes('back')) {
      section = 'back'
      continue
    } else if (
      block.type === 'heading_1' &&
      block.content.includes('explanation')
    ) {
      section = 'explanation'
      continue
    }

    switch (section) {
      case 'front': {
        front.push(block)
        break
      }

      case 'back': {
        back.push(block)
        break
      }

      case 'explanation': {
        explanation.push(block)
        break
      }

      default: {
        break
      }
    }
  }

  return { front, back, explanation }
}
