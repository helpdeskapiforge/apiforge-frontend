import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // <--- Import this
import { Toaster } from "@/components/ui/sonner";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "APIForge API Platform",
  description: "Professional API Client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Wrap content in ThemeProvider */}
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" closeButton />
            {/* Independent, backend-free Gemini chat assistant. Works even if the ApiForge API is offline. */}
            <AssistantWidget />
          </ThemeProvider>
      </body>
    </html>
  );
}