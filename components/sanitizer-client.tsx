"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Shield, Copy, RotateCcw, AlertTriangle, CheckCircle, Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function SanitizerClient() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [found, setFound] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [quickWord, setQuickWord] = useState("")
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const { toast } = useToast()
  const lastProcessedInput = useRef("")

  const handleSanitize = useCallback(async (showToast = true) => {
    if (!input.trim()) {
      if (showToast) {
        toast({ title: "Empty input", description: "Please enter some text to sanitize", variant: "destructive" })
      }
      setOutput("")
      setFound([])
      return
    }

    if (input === lastProcessedInput.current && !showToast) return

    setLoading(true)
    try {
      const res = await fetch("/api/sanitize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          options: { wholeWord, caseSensitive },
        }),
      })

      const data = await res.json()
      if (data.success) {
        setOutput(data.data.sanitized)
        setFound(data.data.found)
        lastProcessedInput.current = input
        if (showToast) {
          toast({
            title: "Sanitization complete",
            description: `Found and replaced ${data.data.count} prohibited word(s)`,
          })
        }
      }
    } catch (error) {
      if (showToast) {
        toast({ title: "Error", description: "Failed to sanitize text", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }, [input, wholeWord, caseSensitive, toast])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSanitize(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [input, wholeWord, caseSensitive, handleSanitize])

  const handleQuickAdd = async () => {
    if (!quickWord.trim()) return

    try {
      const res = await fetch("/api/banned-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: [quickWord.trim()], category: "general", severity: "MEDIUM" }),
      })

      if (res.ok) {
        toast({ title: "Word Added", description: `"${quickWord}" has been added to banned words.` })
        setQuickWord("")
        setIsQuickAddOpen(false)
        handleSanitize(false) // Re-sanitize to pick up new word
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add word", variant: "destructive" })
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    toast({ title: "Copied", description: "Sanitized text copied to clipboard" })
  }

  const handleReset = () => {
    setInput("")
    setOutput("")
    setFound([])
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md">
                <Shield className="h-4 w-4 text-primary" />
              </span>
              Original Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste text here to sanitize..."
              className="min-h-[500px] resize-none font-mono text-sm leading-relaxed"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            
              <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="whole-word" checked={wholeWord} onCheckedChange={setWholeWord} />
                  <Label htmlFor="whole-word" className="text-sm cursor-pointer">Whole word</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="case-sensitive" checked={caseSensitive} onCheckedChange={setCaseSensitive} />
                  <Label htmlFor="case-sensitive" className="text-sm cursor-pointer">Case sensitive</Label>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{input.length} chars</span>
            </div>

             <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1 gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear Input
              </Button>
              
              <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Quick Add Banned Word">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Quick Add Banned Word</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Word or Phrase</Label>
                      <Input 
                        placeholder="Enter word to ban..." 
                        value={quickWord}
                        onChange={(e) => setQuickWord(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                      />
                    </div>
                    <Button onClick={handleQuickAdd} className="w-full">Add to List</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Link href="/words">
                <Button variant="outline" size="icon" title="Word Manager">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="border-2 shadow-sm bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-green-500/10 p-1.5 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </span>
              Sanitized Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                readOnly
                placeholder="Sanitized text will appear here..."
                className="min-h-[500px] resize-none font-mono text-sm leading-relaxed bg-background"
                value={output}
              />
              {output && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              )}
            </div>

            {found.length > 0 && (
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Detected Words ({found.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {found.map((word) => (
                    <Badge key={word} variant="destructive" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {output && !found.length && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                No prohibited words detected
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}