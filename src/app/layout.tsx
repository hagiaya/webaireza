import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalAudioPlayer from "@/components/GlobalAudioPlayer";
import { AudioProvider } from "@/context/AudioContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "Alps Studio - AI Influencer Automation",
  description: "Konten edukasi coding otomatis untuk TikTok, Instagram, YouTube Shorts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased select-none bg-zinc-950 text-zinc-100 min-h-screen flex">
        
        <ToastProvider>
          <AudioProvider>
            <div className="flex w-full min-h-screen">
              {/* Sidebar */}
              <Sidebar />
              
              {/* Main Content Area */}
              <main className="flex-1 flex flex-col min-w-0 md:pl-64 pt-20 md:pt-0">
                <div className="flex-1 p-6 md:p-10 pb-32">
                  {children}
                </div>
              </main>
              
              {/* Global Audio Sticky Bottom Player */}
              <GlobalAudioPlayer />
            </div>
          </AudioProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
