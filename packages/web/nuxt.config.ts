import { fetchSSMParameter } from './utils/fetchSsmParameter'

if (process.env.ENVIRONMENT == null) {
  throw new Error('ENVIRONMENT is not set')
} else {
  console.log(`ENVIRONMENT: ${process.env.ENVIRONMENT}`)
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
        '/api/graphql': {
          target: 'http://localhost:20010/lambda-url/graphql',
          changeOrigin: true
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  },
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      USER_POOL_ID,
      USER_POOL_CLIENT_ID
    }
  },
  postcss: {
    plugins: {
      cssnano: {},
      autoprefixer: {},
      'postcss-preset-env': {
        stage: 3
      }
    }
  }
})
