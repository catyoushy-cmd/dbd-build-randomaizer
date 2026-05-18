import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
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
    <html lang="ru" className={`${manrope.variable} ${jetbrainsMono.variable} dark`}>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <TooltipProvider>
          <div className="relative z-[2]">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
