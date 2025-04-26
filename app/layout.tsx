import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/lib/context/auth-context";
import { ClientAuthWrapper } from "@/components/client-auth-wrapper";
import { LoginButton } from "@/components/login-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SJ Snap",
  description: "Report and track issues",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <ClientAuthWrapper>
            <header className="border-b">
              <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <Link href="/report" className="text-xl font-bold">SJ Snap</Link>
                {/* Desktop navigation */}
                <nav className="hidden md:flex space-x-4">
                  <Link href="/report" className="px-3 py-2 rounded-md hover:bg-gray-100">Report</Link>
                  <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-gray-100">Dashboard</Link>
                  <Link href="/contact" className="px-3 py-2 rounded-md hover:bg-gray-100">Contact</Link>
                </nav>
                <div className="flex items-center space-x-2">
                  <LoginButton />
                </div>
              </div>
            </header>
            <main className="flex-1 pb-16 md:pb-0">
              {children}
            </main>
            {/* Mobile bottom navigation */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white border-t flex justify-around py-2">
              <Link href="/report" className="flex flex-col items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs mt-1">Report</span>
              </Link>
              <Link href="/dashboard" className="flex flex-col items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-xs mt-1">Dashboard</span>
              </Link>
              <Link href="/contact" className="flex flex-col items-center p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xs mt-1">Contact</span>
              </Link>
            </nav>
          </ClientAuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
