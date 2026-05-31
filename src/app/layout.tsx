import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Mic } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Meeting Notes Generator",
  description:
    "Upload meeting audio and instantly get transcripts, summaries and action items powered by Whisper + GPT.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* App shell: a simple sticky header + centered content container. */}
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="container flex h-16 items-center">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Mic className="h-4 w-4" />
                </span>
                AI Meeting Notes
              </Link>
            </div>
          </header>
          <main className="container py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
