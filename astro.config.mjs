import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// If repository is 'blog-frontend', base is '/blog-frontend/'. 
// If repository is renamed to 'moradabaz.github.io', base can be '/'.
const base = process.env.BASE_PATH || '/blog-frontend/';

export default defineConfig({
  site: 'https://moradabaz.github.io',
  base: base,
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true
    }
  }
});
