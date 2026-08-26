import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'KharchyaPani — Personal Expense Tracker',
  description: 'Track, manage, and understand your personal expenses dynamically with live database persistence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
            <p>KharchyaPani Personal Expense Tracker &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
