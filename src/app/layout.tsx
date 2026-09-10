import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeInit } from "@/components/theme-init";
import { NotificationProvider } from "@/components/notification-provider";
import { ShortcutsProvider } from "@/lib/use-keyboard-shortcuts";
import { KeyboardShortcutsManager } from "@/components/keyboard-shortcuts-manager";
import { AuthProvider } from "@/components/auth-provider";
import { GlobalSearch } from "@/components/global-search";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pursuit — Job Search Command Center",
  description:
    "Track applications, automate follow-ups, and land your next role.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeInit />
        <ThemeProvider>
          <AuthProvider>
          <ShortcutsProvider>
            <NotificationProvider />
            <KeyboardShortcutsManager />
            <GlobalSearch />
            {children}
          </ShortcutsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
