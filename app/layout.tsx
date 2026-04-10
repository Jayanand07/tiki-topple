import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tiki Topple 🌺 — Stack Battle Game",
  description:
    "Real-time multiplayer stack battle. Outsmart, Outstack, Win. Play on browser or install as mobile app.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "Tiki Topple 🌺 — Stack Battle Game",
    description:
      "Real-time multiplayer stack battle board game. 2-4 players, AI opponents, secret scoring.",
    type: "website",
    siteName: "Tiki Topple",
  },
  twitter: {
    card: "summary",
    title: "Tiki Topple 🌺",
    description: "Real-time multiplayer stack battle. Outsmart, Outstack, Win.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tiki Topple",
  },
  applicationName: "Tiki Topple",
  keywords: [
    "board game",
    "multiplayer",
    "strategy",
    "tiki",
    "token stacking",
    "online game",
  ],
};

export const viewport: Viewport = {
  themeColor: "#FF6B6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fredoka.variable} ${nunito.variable} font-body antialiased`}
      >
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  );
}
