import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Base configuration for root domain https://moradabaz.github.io
export default defineConfig({
  site: 'https://moradabaz.github.io',
  base: '/',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true
    }
  }
});
