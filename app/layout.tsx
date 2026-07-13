import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://economy-lingo.vercel.app'),
  title: {
    default: '경제 링고 | 매일 10분 경제 공부',
    template: '%s | 경제 링고',
  },
  description: '퀴즈, 뉴스, 경제 캘린더, 커뮤니티와 오답 노트로 경제를 쉽고 꾸준하게 배워보세요.',
  applicationName: '경제 링고',
  keywords: ['경제 공부', '경제 용어', '경제 퀴즈', '금융 문해력'],
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: '경제 링고',
    description: '어려운 경제를 오늘의 언어로 배우는 학습 플랫폼',
    type: 'website',
    locale: 'ko_KR',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f4ef' },
    { media: '(prefers-color-scheme: dark)', color: '#101512' },
  ],
};

import LoginGate from '@/components/LoginGate';
import { ThemeProvider } from '@/context/ThemeContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LoginGate>
            {children}
          </LoginGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
