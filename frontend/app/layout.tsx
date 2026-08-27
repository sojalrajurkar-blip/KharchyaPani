import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { PwaInstallPrompt } from '@/components/ui/PwaInstallPrompt';

export const metadata: Metadata = {
  title: 'KharchyaPani — Personal Expense Tracker',
  description: 'Track, manage, and understand your personal expenses dynamically with live database persistence.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KharchyaPani',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-indigo-500 selection:text-white bg-slate-950">
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
            <p>KharchyaPani Personal Expense Tracker &copy; {new Date().getFullYear()}</p>
          </footer>
          <PwaInstallPrompt />
        </div>
      </body>
    </html>
  );
}
