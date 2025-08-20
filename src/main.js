import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/assets/main.css'

import { i18n } from '@/i18n/i18n.js'

import AV from 'leancloud-storage'
AV.init({
    appId: 'RK6oyJITqdsXBYBiCNCzhvr4-MdYXbMMI',
    appKey: 'eE0bJJ6nxNCL8MO08Xl1VNHR',
    serverURL: 'https://lc-sarmp-api.cosh.work',
})

const app = createApp(App)

app.use(router)
app.use(i18n)

app.mount('#app')
