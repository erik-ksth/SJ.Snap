import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { SupabaseAuthProvider } from "@/lib/context/supabase-auth-context";
import { ClientAuthWrapper } from "@/components/client-auth-wrapper";
import { LoginButton } from "@/components/login-button";
import Image from 'next/image';

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
      <head>
        {/* Add your link here */}
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SupabaseAuthProvider>
          <ClientAuthWrapper>
            <header className="border-b">
              <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                {/* <Link href="/dashboard" className="text-xl font-bold">SJ Snap</Link> */}
                <Link
                  href="/dashboard"
                  className="text-xl font-bold flex items-center"
                >
                  <Image
                    src="/logo_nobg.png"
                    alt="SJ Snap Logo"
                    width={80}
                    height={80}
                    priority
                  />
                </Link>
                {/* Desktop navigation */}
                <nav className="hidden md:flex space-x-4">
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/report"
                    className="px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    Report
                  </Link>
                  <Link
                    href="/contact"
                    className="px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    Contact
                  </Link>
                </nav>
                <div className="flex items-center space-x-2">
                  <LoginButton />
                </div>
              </div>
            </header>
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            {/* Mobile bottom navigation */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white border-t flex justify-around items-center py-2">
              <Link
                href="/dashboard"
                className="flex flex-col items-center p-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-xs mt-1">Dashboard</span>
              </Link>

              {/* Report button (centered and prominent) */}
              <Link href="/report" className="flex flex-col items-center -mt-8">
                <div className="bg-white text-black rounded-full p-4 shadow-lg border border-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </Link>

              <Link href="/contact" className="flex flex-col items-center p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs mt-1">Contact</span>
              </Link>
            </nav>
          </ClientAuthWrapper>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
