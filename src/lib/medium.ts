import { XMLParser } from 'fast-xml-parser';

export interface MediumPost {
  title: string;
  link: string;
  pubDate: string;
  formattedDate: string;
  guid: string;
  author: string;
  thumbnail: string;
  snippet: string;
  categories: string[];
}

const MEDIUM_RSS_URL = 'https://medium.com/feed/@moradabaz';
const RSS2JSON_FALLBACK = 'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@moradabaz';

export async function fetchMediumPosts(): Promise<MediumPost[]> {
  try {
    // Strategy 1: Fetch direct RSS XML from Medium
    const response = await fetch(MEDIUM_RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      const xmlText = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
      });
      const parsed = parser.parse(xmlText);
      const items = parsed?.rss?.channel?.item;

      if (Array.isArray(items) && items.length > 0) {
        return items.map((item: any) => formatRssItem(item));
      }
    }
  } catch (err) {
    console.warn('Direct RSS fetch failed, attempting fallback to rss2json:', err);
  }

  try {
    // Strategy 2: Fallback to RSS2JSON API if direct XML parser fails (e.g. CORS/formatting)
    const fallbackRes = await fetch(RSS2JSON_FALLBACK);
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (data.items && Array.isArray(data.items)) {
        return data.items.map((item: any) => ({
          title: item.title || 'Untitled Post',
          link: item.link || 'https://medium.com/@moradabaz',
          pubDate: item.pubDate || new Date().toISOString(),
          formattedDate: formatDate(item.pubDate),
          guid: item.guid || item.link,
          author: item.author || 'Morad Abaz',
          thumbnail: item.thumbnail || extractImageFromHtml(item.content || item.description) || '/images/medium-default.jpg',
          snippet: cleanHtmlSnippet(item.description || item.content),
          categories: item.categories || ['Tech', 'Data Engineering']
        }));
      }
    }
  } catch (err) {
    console.error('Failed to fetch Medium posts via fallback API:', err);
  }

  // Fallback default posts if network is entirely offline during build
  return getFallbackPosts();
}

function formatRssItem(item: any): MediumPost {
  const content = item['content:encoded'] || item.description || '';
  const categories = Array.isArray(item.category) 
    ? item.category 
    : (item.category ? [item.category] : ['Software Engineering']);

  return {
    title: item.title || 'Untitled Story',
    link: item.link || 'https://medium.com/@moradabaz',
    pubDate: item.pubDate || new Date().toISOString(),
    formattedDate: formatDate(item.pubDate),
    guid: item.guid?.['#text'] || item.guid || item.link,
    author: item['dc:creator'] || 'Morad Abaz',
    thumbnail: extractImageFromHtml(content) || '/images/medium-default.jpg',
    snippet: cleanHtmlSnippet(content),
    categories
  };
}

function extractImageFromHtml(html: string): string | null {
  if (!html) return null;
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

function cleanHtmlSnippet(html: string): string {
  if (!html) return '';
  const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plainText.length > 200 ? plainText.substring(0, 197) + '...' : plainText;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function getFallbackPosts(): MediumPost[] {
  return [
    {
      title: "Building a Semantic Layer from Zero (Part 2): Can Column Descriptions Alone Stop an LLM From Hallucinating SQL?",
      link: "https://medium.com/@moradabaz",
      pubDate: "2026-08-20",
      formattedDate: "Aug 20, 2026",
      guid: "fallback-1",
      author: "Morad Abaz",
      thumbnail: "https://cdn-images-1.medium.com/max/1024/1*fallback.png",
      snippet: "Same 6 questions, same database — but this time the model gets the schema. 6/6 correct. And one formula in a one-line description that prevents a bug you won't see again until post 5.",
      categories: ["LLM", "Data Science", "SQL", "PostgreSQL"]
    },
    {
      title: "6 questions, 12 attempts, 1 silent fabrication that would have gone straight into a report",
      link: "https://medium.com/@moradabaz",
      pubDate: "2026-08-10",
      formattedDate: "Aug 10, 2026",
      guid: "fallback-2",
      author: "Morad Abaz",
      thumbnail: "https://cdn-images-1.medium.com/max/1024/1*fallback.png",
      snippet: "How much context does a model actually need to answer SQL questions correctly? We take a real Postgres database and test 6 business questions at each level of context.",
      categories: ["AI", "Database", "Engineering"]
    }
  ];
}
