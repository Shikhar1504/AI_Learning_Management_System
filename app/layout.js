import { Toaster } from "@/components/ui/toaster";
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
                {/* Background Elements */}
                <div className="fixed inset-0 -z-10">
                  <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
                  <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl animate-pulse delay-2000" />
                </div>
                {children}
              </main>
              <Toaster />
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
