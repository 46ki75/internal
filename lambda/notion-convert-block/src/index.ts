import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { Client } from '@notionhq/client'
import { DOMJSON, NotionEXClient } from 'notion-ex'

interface Payload {
  block_id: string
}

export const handler = async (event: Payload): Promise<DOMJSON[]> => {
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

  return result
}
