import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";
import MobileNav from "@/components/MobileNav";
import { PlayerProvider } from "@/components/PlayerProvider";
import HiddenYouTubeHost from "@/components/HiddenYouTubeHost";

export const metadata: Metadata = {
  title: "Asoy — music player",
  description: "A Spotify-style web music player built with Next.js + Tailwind",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-black text-white">
        <PlayerProvider>
          <div className="flex h-dvh flex-col">
            <div className="flex flex-1 gap-2 p-2 pb-0 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto rounded-lg bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#0a0a0a]">
                {children}
              </main>
            </div>
            <Player />
            <MobileNav />
          </div>
          <HiddenYouTubeHost />
        </PlayerProvider>
      </body>
    </html>
  );
}
