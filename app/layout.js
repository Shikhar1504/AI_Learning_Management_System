import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Provider from "./provider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "LearnForge - AI-Powered Learning Platform",
  description:
    "Transform your learning journey with AI-generated courses, interactive content, and personalized study materials. Built for professionals and learners.",
  keywords: "AI learning, course generation, education technology, professional development",
  authors: [{ name: "LearnForge" }],
  creator: "LearnForge",
  publisher: "LearnForge",
  openGraph: {
    title: "LearnForge - AI Learning Platform",
    description: "AI-powered course generation with interactive learning tools",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{ elements: { footer: 'hidden' } }}>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className={`${jakarta.variable} ${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Provider>
              <main className="min-h-screen relative overflow-hidden">
                {/* Unified Global Background System */}
                <div 
                  className="fixed inset-0 -z-10" 
                  style={{
                    background: `
                      radial-gradient(circle at 20% 30%, rgba(56,189,248,0.12), transparent 40%),
                      radial-gradient(circle at 80% 70%, rgba(20,184,166,0.10), transparent 40%),
                      radial-gradient(circle at 60% 20%, rgba(168,85,247,0.05), transparent 35%),
                      #0b0f1a
                    `
                  }} 
                />
                {children}
              </main>
              <Toaster />
              <SonnerToaster position="bottom-right" theme="dark" />
            </Provider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

{
  /*When you define a RootLayout in layout.js, it acts as a wrapper for the pages defined in page.js.
In Next.js 13 (and later), each page.js is automatically considered a child of the RootLayout.*/
}
