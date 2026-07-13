import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/quiz', '/ranking', '/news', '/calendar', '/community', '/wrong-answers'];
  return routes.map((route) => ({
    url: `https://economy-lingo.vercel.app${route}`,
    changeFrequency: route === '/news' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
