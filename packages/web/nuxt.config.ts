import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

if (process.env.ENVIRONMENT == null) {
  throw new Error('ENVIRONMENT is not set')
} else {
  console.log(`ENVIRONMENT: ${process.env.ENVIRONMENT}`)
}

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

const USER_POOL_ID = await fetchSSMParameter(
  `/${process.env.ENVIRONMENT}/46ki75/internal/cognito/userpool/id`
)

const USER_POOL_CLIENT_ID = await fetchSSMParameter(
  `/${process.env.ENVIRONMENT}/46ki75/internal/cognito/userpool/client/id`
)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  devServer: { port: 20000 },
  vite: {
    server: {
      proxy: {
        '/api/graphql': { target: 'http://localhost:20010', changeOrigin: true }
      }
    }
  },
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      USER_POOL_ID,
      USER_POOL_CLIENT_ID
    }
  }
})
