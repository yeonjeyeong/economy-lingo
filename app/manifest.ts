import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '경제 링고',
    short_name: '경제 링고',
    description: '매일 10분, 쉬운 경제 공부',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f4ef',
    theme_color: '#173f35',
    lang: 'ko',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
