import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nadya AI - Your Smart Fitness Companion",
  description:
    "Track workouts, log meals, crush challenges, and level up your fitness journey with Nadya AI — your AI-powered fitness companion.",
  keywords: ["fitness", "AI", "workout", "nutrition", "health", "tracking"],
  authors: [{ name: "Nadya AI" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nadya AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#030712" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {
                    // Force check for updates every time
                    reg.update();
                    // If new version available, activate immediately
                    reg.addEventListener('updatefound', function() {
                      const newWorker = reg.installing;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'activated') {
                          // Reload to get new version
                          window.location.reload();
                        }
                      });
                    });
                  }).catch(function() {});

                  // Listen for messages from service worker
                  navigator.serviceWorker.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'RELOAD') {
                      window.location.reload();
                    }
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#030712] text-gray-50 font-system">
        {children}
      </body>
    </html>
  );
}
