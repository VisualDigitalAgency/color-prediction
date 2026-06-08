import type { Metadata, Viewport } from "next";
import { Poppins, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/* Three theme fonts, preloaded (ADR 0007) and exposed as CSS variables that
   each theme's `font` references. Neon → Poppins, Fintech → Manrope,
   Cyber → Space Grotesk. ThemeProvider (step 3) sets --app-font per theme. */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AuraWin",
  description: "AuraWin — color-prediction game (simulated demo, no real money).",
};

export const viewport: Viewport = {
  themeColor: "#06060d",
  width: "device-width",
  initialScale: 1,
};

/* No-flash: set data-theme from localStorage before first paint to avoid FOUC.
   Default theme is "neon". The full var application happens in ThemeProvider. */
const noFlashScript = `(function(){try{var t=localStorage.getItem('aurawin:v1:settings:theme')||'neon';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','neon');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="neon"
      className={`${poppins.variable} ${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
