import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

class Factory {
  private client: SSMClient
  private cache: Map<string, string>

  constructor() {
    this.client = new SSMClient({ region: 'ap-northeast-1' })
    this.cache = new Map<string, string>()
  }

  public async getParameter(name: string) {
    let parameter: string | undefined
    parameter = this.cache.get(name)

    if (parameter != null) return parameter

    const command = new GetParameterCommand({
      Name: name,
      WithDecryption: true
    })

    const response = await this.client.send(command)

    if (response.Parameter.Value != null) {
      this.cache.set(name, response.Parameter.Value)
      return response.Parameter.Value
    } else {
      throw new Error('Parameter not found.')
    }
  }
}

export const factory = new Factory()
