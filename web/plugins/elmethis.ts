// plugins/vue-query.ts
import { defineNuxtPlugin } from '#app'
import { ElmethisPlugin } from 'elmethis'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(ElmethisPlugin)
})
