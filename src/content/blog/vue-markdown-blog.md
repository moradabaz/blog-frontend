---
title: "Creating a Simple Blog using Vue + Markdown"
description: "A simple and neat way to add a blogging feature to a personal website using Vue and Markdown."
pubDate: 2019-03-18
author: "Morad Abaz"
category: "Web Development"
tags: ["Vue", "Markdown", "JavaScript", "Frontend"]
---

Building a personal blog is one of the best ways to learn new frontend frameworks and practice writing tech articles.

This post tells the story of how I set up Markdown rendering on a Vue website, structuring data in JSON and loading Markdown files dynamically.

---

## 1. Why Markdown?

Hardcoding HTML pages for every blog post creates clutter. Markdown provides a clean, readable syntax that compiles down into standard HTML elements:

- Easy to write and edit in any editor
- Portable across static site generators and CMS tools
- Keeps styling decoupled from content

---

## 2. Dynamic Routing & File Loading

By organizing blog entries in a central JSON file and importing `.md` files dynamically, we can build flexible listing pages and post views.

```javascript
import BlogEntries from './statics/data/blogs.json';

const blogRoutes = Object.keys(BlogEntries).map(section => {
  return {
    path: `/${section}`,
    component: () => import('./views/Blog.vue')
  };
});
```

---

## 3. Conclusion

Using Markdown for personal blogs remains a timeless pattern for developer websites. As web tooling evolves (from Vue CLI loaders to modern tools like Vite and Astro), static markdown remains standard, fast, and easy to maintain!
