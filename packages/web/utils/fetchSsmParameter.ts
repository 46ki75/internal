import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

export const fetchSSMParameter = async (name: string): Promise<string> => {
  const client = new SSMClient({ region: 'ap-northeast-1' })

  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true
  })

  const response = await client.send(command)

  if (response.Parameter?.Value == null) {
    throw new Error(`Parameter ${name} not found`)
  }

  return response.Parameter.Value
}
