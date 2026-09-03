import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { PwaInstallPrompt } from '@/components/ui/PwaInstallPrompt';
import { KharchaMitraDrawer } from '@/components/ai/KharchaMitraDrawer';
import { AuthProvider } from '@/context/AuthContext';


export const metadata: Metadata = {
  title: 'KharchyaPani — Personal Expense Tracker',
  description: 'Track, manage, and understand your personal expenses dynamically with live database persistence.',
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
      <body className="antialiased selection:bg-sky-500 selection:text-white relative min-h-screen text-slate-100 overflow-x-hidden">
        {/* Sleek Titanium & Ice Blue Ambient Glowing Orbs & Tech Micro-Grid */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Top Left Electric Ice Blue Glow */}
          <div className="absolute -top-[15%] -left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-sky-500/22 via-cyan-500/12 to-transparent blur-[140px]" />
          {/* Top Right Deep Titanium & Steel Blue Glow */}
          <div className="absolute top-[10%] -right-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-blue-600/18 via-slate-700/20 to-transparent blur-[150px]" />
          {/* Bottom Left Ice Cyan Accent Glow */}
          <div className="absolute bottom-[0%] left-[25%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-500/18 via-sky-600/10 to-transparent blur-[130px]" />
          {/* Micro-dot Grid Pattern with Ice Blue Tint */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(56,189,248,0.08)_1px,transparent_1px)] [background-size:26px_26px] opacity-80" />
        </div>

        <AuthProvider>
          <div className="min-h-screen flex flex-col relative z-0">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
              <p>KharchyaPani Personal Expense Tracker &copy; {new Date().getFullYear()}</p>
            </footer>
            <PwaInstallPrompt />
            <KharchaMitraDrawer />
          </div>
        </AuthProvider>

      </body>
    </html>
  );
}
