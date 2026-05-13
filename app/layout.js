export const metadata = {
  title: '브리딩 알림',
  description: '납테일게코 브리딩 알림 앱',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
