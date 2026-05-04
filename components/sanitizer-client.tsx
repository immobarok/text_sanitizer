"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Shield, Copy, RotateCcw, AlertTriangle, CheckCircle, Settings, Plus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { sanitizeText, WordRule } from "@/lib/utils"

export function SanitizerClient() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [found, setFound] = useState<string[]>([])
  const [wholeWord, setWholeWord] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  
  // Rules
  const [dbRules, setDbRules] = useState<WordRule[]>([])
  const [localRules, setLocalRules] = useState<WordRule[]>([])
  
  // Quick Add
  const [quickWord, setQuickWord] = useState("")
  const [quickReplacement, setQuickReplacement] = useState("****")
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  
  const { toast } = useToast()

  // Fetch DB words once on mount
  useEffect(() => {
    const fetchDbWords = async () => {
      try {
        const res = await fetch("/api/banned-words")
        const data = await res.json()
        if (data.success) {
          setDbRules(data.data.map((w: any) => ({ word: w.word, replacement: w.replacement })))
        }
      } catch (error) {
        console.error("Failed to fetch database words:", error)
      }
    }
    fetchDbWords()

    // Load local words from localStorage
    const savedLocal = localStorage.getItem("local_sanitizer_rules")
    if (savedLocal) {
      try {
        setLocalRules(JSON.parse(savedLocal))
      } catch (e) {
        console.error("Failed to parse local rules")
      }
    }
  }, [])

  // Instant sanitization
  useEffect(() => {
    const allRules = [...dbRules, ...localRules]
    const result = sanitizeText(input, allRules, { wholeWord, caseSensitive })
    setOutput(result.sanitized)
    setFound(result.found)
  }, [input, dbRules, localRules, wholeWord, caseSensitive])

  const handleQuickAdd = () => {
    if (!quickWord.trim()) return

    const newRule: WordRule = {
      word: quickWord.toLowerCase().trim(),
      replacement: quickReplacement.trim() || "****"
    }

    const updatedLocal = [...localRules, newRule]
    setLocalRules(updatedLocal)
    localStorage.setItem("local_sanitizer_rules", JSON.stringify(updatedLocal))

    toast({ 
      title: "Local Word Added", 
      description: `"${quickWord}" will be replaced by "${newRule.replacement}" in this browser only.` 
    })
    
    setQuickWord("")
    setQuickReplacement("****")
    setIsQuickAddOpen(false)
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

  const clearLocalRules = () => {
    setLocalRules([])
    localStorage.removeItem("local_sanitizer_rules")
    toast({ title: "Local Rules Cleared" })
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 p-1.5 rounded-md">
                  <Shield className="h-4 w-4 text-primary" />
                </span>
                Original Text
              </div>
              <Badge variant="outline" className="font-normal text-xs">
                Instant Mode
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste here ..."
              className="min-h-[600px] resize-none font-mono text-sm leading-relaxed"
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
                Clear
              </Button>
              
              <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Word
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Local Sanitization Word</DialogTitle>
                    <DialogDescription>
                      This word will only be sanitized in your current browser. It will not be saved to our database.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Word or Phrase to find</Label>
                      <Input 
                        placeholder="e.g. secret" 
                        value={quickWord}
                        onChange={(e) => setQuickWord(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Replacement Word</Label>
                      <Input 
                        placeholder="e.g. [REDACTED]" 
                        value={quickReplacement}
                        onChange={(e) => setQuickReplacement(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                      />
                    </div>
                    <Button onClick={handleQuickAdd} className="w-full">Add</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Link href="/admin">
                <Button variant="outline" size="icon" title="Admin Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {localRules.length > 0 && (
              <div className="pt-2">
                <Button variant="ghost" size="sm" onClick={clearLocalRules} className="text-xs text-muted-foreground h-auto p-0 hover:bg-transparent hover:text-destructive">
                  Clear {localRules.length} local rules
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="border-2 shadow-sm bg-muted/5">
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
                placeholder="Sanitized text..."
                className="min-h-[600px] resize-none font-mono text-sm leading-relaxed bg-white"
                value={output}
              />
              {output && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 border shadow-sm"
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
                  Detected Prohibited Content ({found.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {found.map((word, i) => (
                    <Badge key={i} variant="destructive" className="text-xs font-mono">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {output && !found.length && input.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" />
                Clean text: No prohibited words detected
              </div>
            )}
            
            {/* <div className="rounded-lg border bg-blue-50/30 p-3 flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-semibold">How it works:</p>
                <p>1. Official words from our database are always applied.</p>
                <p>2. Words you add locally only apply to your browser.</p>
                <p>3. Sanitization happens instantly on your device.</p>
              </div>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}