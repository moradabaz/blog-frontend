import Vue from 'vue'
import App from './App.vue'
import router from './router'


import BootstrapVue from 'bootstrap-vue'
import Vuesax from "vuesax"
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Dialog from 'vue-dialog-loading'
import Vuetify from "vuetify";


Vue.config.productionTip = false
Vue.use(BootstrapVue);
Vue.use(Vuesax)
Vue.use(Vuetify);
Vue.prototype.$backendURL = 'https://personalwebproject.herokuapp.com/api/v1.0/'

Vue.use(Dialog, {
  dialogBtnColor: '#0f0'
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
