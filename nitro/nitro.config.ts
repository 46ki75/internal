//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: 'server',
  inlineDynamicImports: true,
  preset: 'aws-lambda',
  baseURL: '/api'
})
