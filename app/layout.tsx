import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Pulse Lab. — A soft body that beats',
  icons: {
    icon:
      process.env.GITHUB_ACTIONS === 'true'
        ? '/pulse-lab/favicon.svg'
        : '/favicon.svg',
  },
  description:
    'An interactive XPBD soft-body heart. It contracts on its own, stretches when you grab it, and races when you handle it.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
