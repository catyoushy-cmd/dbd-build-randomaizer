import type { Metadata } from "next";
import { Inter, Onest } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
});

export const metadata: Metadata = {
  title: "DBD Build Randomizer",
  description: "Рандомайзер билдов для Dead by Daylight",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${onest.variable} dark`}>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <TooltipProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
