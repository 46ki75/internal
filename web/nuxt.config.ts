// https://nuxt.com/docs/api/configuration/nuxt-config

import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  build: { transpile: ['vuetify'] },
  devtools: { enabled: true },
  devServer: { port: 5000 },

  vite: {
    server: { proxy: { '/api': 'http://localhost:3000' } },
    vue: {
      template: {
        transformAssetUrls
      }
    }
  },

  css: [
    '~/static/global.scss',
    '@fortawesome/fontawesome-svg-core/styles.css',
    'elmethis/dist/style.css'
  ],

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins!.push(vuetify({ autoImport: true }))
      })
    },
    '@pinia/nuxt'
  ],

  plugins: [
    '~/plugins/vuetify.ts',
    '~/plugins/auth.ts',
    '~/plugins/vue-query.ts'
  ],

  compatibilityDate: '2024-08-03'
})