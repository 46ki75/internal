import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'

// vue-router
import router from './router'

// tanstack-query
import { VueQueryPlugin } from '@tanstack/vue-query'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'default',
    themes: { default: { colors: { primary: 'rgb(40,40,40)' } } }
  }
})

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.use(VueQueryPlugin)
app.mount('#app')
