import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Text Sanitizer Pro",
  description: "Advanced content moderation and text sanitization platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="min-h-screen bg-[#f1f3f4] dark:bg-[#020202] flex items-center justify-center p-4 transition-colors duration-300">
            <main className="w-full max-w-[1400px]">
              {children}
            </main>
          </div>  
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}