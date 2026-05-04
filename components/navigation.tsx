"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {  FileText, Settings, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function Navigation() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const routes = [
    { href: "/", label: "Sanitizer", icon: FileText },
    { href: "/words", label: "Word Manager", icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-8xl">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" className="h-10 w-auto" width={100} height={100}/>
          <h1 className="text-xl font-semibold italic">Text Sanitizer</h1>
        </Link>

        <nav className="flex items-center gap-1">
          {routes.map((route) => (
            <Link key={route.href} href={route.href}>
              <Button
                variant={pathname === route.href ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2",
                  pathname === route.href && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Button>
            </Link>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}