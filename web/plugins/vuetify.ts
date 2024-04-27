// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'default',
      themes: {
        default: {
          dark: false,
          colors: {
            primary: 'rgb(50, 50, 50)',
            secondary: 'rgb(200, 200, 200)'
          }
        }
      }
    }
  })
  app.vueApp.use(vuetify)
})
