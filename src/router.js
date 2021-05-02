import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import ModelCreationForm from './views/ModelCreationForm'
import ModelPredictionForm from "./views/ModelPredictionForm";
import About from './views/About'
import AdultIncome from "./components/AdultIncome";

Vue.use(Router)

import BlogEntries from './statics/data/blogs.json';

const blogRoutes = Object.keys(BlogEntries).map(section => {
  const children = BlogEntries[section].map(child => ({
    path: child.id,
    name: child.id,
    component: () => import(`./markdowns/${section}/${child.id}.md`)
  }))
  return {
    path: `/${section}`,
    name: section,
    component: () => import('./views/Blog.vue'),
    children
  }
})



export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/predict-time-series/',
      name: 'ModelCreationForm',
      component: ModelCreationForm
    },
    {
      path: '/about/',
      name: 'About',
      component: About
    },
    {
      path: '/predict-models/',
      name: 'ModelPredictionForm',
      component: ModelPredictionForm
    },
    {
      path: '/adult-income/',
      name: 'AdultIncome',
      component: AdultIncome
    },
    ...blogRoutes
  ]
})
