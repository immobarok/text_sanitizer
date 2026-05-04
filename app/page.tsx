import { SanitizerClient } from "@/components/sanitizer-client";

export default function Home() {
  return (
    <div className="space-y-8 container mx-auto px-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight animate-gradient-x bg-gradient-to-r from-primary via-[#02b6eb] to-blue-700 bg-clip-text text-transparent">
            Text Sanitizer
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Paste your content below to automatically detect and sanitize prohibited words and phrases.
        </p>
      </div>
      <SanitizerClient />
    </div>
  )
}