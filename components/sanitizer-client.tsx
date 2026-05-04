"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Shield, Copy, RotateCcw, AlertTriangle, CheckCircle, Plus, X, Search, FileText, Sun, Moon, Hash, Type, AlignLeft, MousePointer2, Sparkles, Wand2, Loader2, Clock, ChevronRight, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { sanitizeText, WordRule } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface Tab {
  id: string
  name: string
  content: string
}

interface HistoryItem {
  id: string
  timestamp: Date
  content: string
  type: "ai" | "manual"
}

export function SanitizerClient() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: "1", name: "WORKSPACE 1", content: "" }])
  const [activeTabId, setActiveTabId] = useState("1")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [dbRules, setDbRules] = useState<WordRule[]>([])
  const [localRules, setLocalRules] = useState<WordRule[]>([])
  const [quickWord, setQuickWord] = useState("")
  const [quickReplacement, setQuickReplacement] = useState("")
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isAiEnabled, setIsAiEnabled] = useState(true)
  const [isAiLoading, setIsAiLoading] = useState(false)
  
  // Suggestion States
  const [multiSuggestions, setMultiSuggestions] = useState<string[]>([])
  const [inlineSuffix, setInlineSuffix] = useState("")
  const [inlineReplacement, setInlineReplacement] = useState("")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([])
  
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => setMounted(true), [])

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId])

  useEffect(() => {
    const fetchDbWords = async () => {
      try {
        const res = await fetch("/api/banned-words")
        const data = await res.json()
        if (data.success) setDbRules(data.data.map((w: any) => ({ word: w.word, replacement: w.replacement })))
      } catch (e) {}
    }
    fetchDbWords()
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        setIsSearchVisible(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
      if (e.key === "Escape") {
        setIsSearchVisible(false)
        setSearchQuery("")
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    const savedLocal = localStorage.getItem("local_sanitizer_rules")
    if (savedLocal) setLocalRules(JSON.parse(savedLocal))
    
    const savedTabs = localStorage.getItem("sanitizer_tabs")
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed)
          setActiveTabId(parsed[0].id)
        }
      } catch (e) {}
    }

    const savedHistory = localStorage.getItem("sanitizer_history")
    if (savedHistory) setHistory(JSON.parse(savedHistory))

    const savedAccepted = localStorage.getItem("accepted_suggestions")
    if (savedAccepted) setAcceptedSuggestions(JSON.parse(savedAccepted))

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    localStorage.setItem("sanitizer_tabs", JSON.stringify(tabs))
  }, [tabs])

  useEffect(() => {
    localStorage.setItem("sanitizer_history", JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem("accepted_suggestions", JSON.stringify(acceptedSuggestions))
  }, [acceptedSuggestions])

  // Multi-Suggestion Logic
  useEffect(() => {
    if (!isAiEnabled || !activeTab.content) {
      setMultiSuggestions([])
      setInlineSuffix("")
      return
    }

    const cursor = sourceTextareaRef.current?.selectionStart || 0
    const textBefore = activeTab.content.substring(0, cursor)
    const match = textBefore.match(/(\w+)$/)
    
    if (match) {
      const currentWord = match[1].toLowerCase()
      if (currentWord.length >= 2) {
        const allRules = [...dbRules, ...localRules]
        
        // Check for Inline Suggestion
        const matchingRule = allRules.find(r => r.word.toLowerCase().startsWith(currentWord))
        if (matchingRule) {
          const w = matchingRule.word
          const parts = []
          for (let i = 0; i < w.length; i += 2) {
            parts.push(w.substring(i, i + 2))
          }
          const target = parts.join('-')
          
          setInlineReplacement(target)
          
          if (currentWord === matchingRule.word.toLowerCase()) {
            setInlineSuffix(` → ${target}`)
          } else {
            // e.g. typed "goo", rule is "google". Suffix is "gle"
            setInlineSuffix(matchingRule.word.substring(currentWord.length))
          }
        } else {
          setInlineSuffix("")
          setInlineReplacement("")
        }

        // Top Tray Suggestions
        const allWords = allRules.map(r => r.word.toLowerCase())
        const matches = allWords.filter(w => w.startsWith(currentWord) && w !== currentWord)
        setMultiSuggestions(matches.slice(0, 3))
        return
      }
    }
    setMultiSuggestions([])
    setInlineSuffix("")
    setInlineReplacement("")
  }, [activeTab.content, isAiEnabled, dbRules, localRules])

  const acceptInlineSuggestion = () => {
    const textarea = sourceTextareaRef.current
    if (!textarea || !inlineReplacement) return
    
    const cursor = textarea.selectionStart
    const textBefore = activeTab.content.substring(0, cursor)
    const match = textBefore.match(/(\w+)$/)
    if (!match) return
    
    const start = cursor - match[1].length
    const after = activeTab.content.substring(cursor)
    
    const newContent = activeTab.content.substring(0, start) + inlineReplacement + after
    updateActiveContent(newContent)
    
    setInlineSuffix("")
    setInlineReplacement("")
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + inlineReplacement.length, start + inlineReplacement.length)
    }, 10)
  }

  const acceptSuggestion = (predicted: string) => {
    const textarea = sourceTextareaRef.current
    if (!textarea) return
    
    const cursor = textarea.selectionStart
    const textBefore = activeTab.content.substring(0, cursor)
    const match = textBefore.match(/(\w+)$/)
    if (!match) return
    
    const currentWordLength = match[1].length
    const start = cursor - currentWordLength
    const after = activeTab.content.substring(cursor)
    
    const newContent = activeTab.content.substring(0, start) + predicted + after
    updateActiveContent(newContent)
    
    // Add to history
    setAcceptedSuggestions(prev => [predicted, ...prev.filter(w => w !== predicted)].slice(0, 10))
    setMultiSuggestions([])
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + predicted.length, start + predicted.length)
    }, 10)
  }

  const handleAiRefine = async () => {
    if (!activeTab.content) return
    setIsAiLoading(true)
    try {
      const res = await fetch("/api/ai-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: activeTab.content,
          rules: [...dbRules, ...localRules]
        })
      })
      const data = await res.json()
      if (data.success) {
        // Save current to history before updating
        const historyItem: HistoryItem = {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
          content: activeTab.content,
          type: "manual"
        }
        setHistory(prev => [historyItem, ...prev].slice(0, 20))
        
        updateActiveContent(data.data)
        toast({ title: "AI Refinement Applied" })
      } else {
        toast({ title: "AI Refine Failed", description: data.error, variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "AI Refine Error", variant: "destructive" })
    } finally {
      setIsAiLoading(false)
    }
  }

  const addTab = () => {
    const newId = Math.random().toString(36).substring(7)
    setTabs([...tabs, { id: newId, name: `WORKSPACE ${tabs.length + 1}`, content: "" }])
    setActiveTabId(newId)
  }

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabs.length === 1) {
      updateActiveContent("")
      return
    }
    const newTabs = tabs.filter(t => t.id !== id)
    setTabs(newTabs)
    if (activeTabId === id) setActiveTabId(newTabs[0].id)
  }

  const updateActiveContent = (val: string) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, content: val } : t))
  }

  const { output, found } = useMemo(() => {
    const allRules = [...dbRules, ...localRules]
    const result = sanitizeText(activeTab.content, allRules, { caseSensitive: false, wholeWord: false })
    return { output: result.sanitized, found: result.found }
  }, [activeTab.content, dbRules, localRules])

  const stats = useMemo(() => {
    const text = activeTab.content
    return {
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      characters: text.length,
      paragraphs: text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0,
      whitespace: (text.match(/\s/g) || []).length,
      flagged: found.length
    }
  }, [activeTab.content, found])

  const searchMatches = useMemo(() => {
    if (!searchQuery) return 0
    try {
      return (activeTab.content.match(new RegExp(searchQuery, "gi")) || []).length
    } catch (e) { return 0 }
  }, [searchQuery, activeTab.content])

  const handleQuickAdd = () => {
    if (!quickWord.trim()) return
    const newRule = { word: quickWord.toLowerCase().trim(), replacement: quickReplacement.trim() }
    const updated = [...localRules, newRule]
    setLocalRules(updated)
    localStorage.setItem("local_sanitizer_rules", JSON.stringify(updated))
    toast({ title: "Rule Added Successfully" })
    setQuickWord("")
    setQuickReplacement("")
    setIsQuickAddOpen(false)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-[calc(100vh-40px)] border rounded-2xl overflow-hidden bg-background shadow-2xl relative">
        
        {/* Header Block */}
        <div className="bg-[#f8f9fa] dark:bg-[#0a0a0a] border-b relative z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl border bg-white dark:bg-zinc-900">
                <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-md" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-foreground leading-none">
                    TEXT<span className="text-primary">SANITIZER</span>
                  </h1>
                  <Badge variant="outline" className="text-[8px] font-black tracking-widest h-4 px-1.5 border-primary/20 text-primary">PREDICTIVE</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5">
                  Intelligence Suite
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">


              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsAiEnabled(!isAiEnabled)
                      toast({ title: `Predictive Dictionary ${!isAiEnabled ? 'Enabled' : 'Disabled'}` })
                    }}
                    className={cn(
                      "rounded-xl h-10 w-10 border shadow-sm transition-all duration-300",
                      isAiEnabled ? "bg-primary/5 border-primary/20 text-primary" : "bg-white dark:bg-zinc-900"
                    )}
                  >
                    <Sparkles className={cn("h-4 w-4", isAiEnabled && "fill-primary/10")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-[10px] font-bold">Toggle Suggestions</p></TooltipContent>
              </Tooltip>

              <div className={cn(
                "flex items-center bg-white dark:bg-zinc-900 border rounded-xl px-3 h-10 transition-all duration-300 overflow-hidden",
                isSearchVisible ? "w-[240px] opacity-100 mr-2 shadow-sm" : "w-0 opacity-0 border-none p-0 mr-0"
              )}>
                <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  placeholder="Find in text..."
                  className="bg-transparent border-0 focus:ring-0 text-xs w-full h-full outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <span className="text-[10px] font-bold text-primary font-mono bg-primary/10 px-1.5 rounded ml-2 shrink-0">
                    {searchMatches}
                  </span>
                )}
                <X 
                  className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer ml-2 shrink-0" 
                  onClick={() => { setIsSearchVisible(false); setSearchQuery(""); }}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSearchVisible(!isSearchVisible)
                  if (!isSearchVisible) setTimeout(() => searchInputRef.current?.focus(), 50)
                }}
                className={cn("rounded-xl h-10 w-10 border bg-white dark:bg-zinc-900 shadow-sm transition-colors", isSearchVisible && "text-primary")}
              >
                <Search className="h-4 w-4" />
              </Button>

              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="rounded-xl h-10 w-10 border bg-white dark:bg-zinc-900 shadow-sm"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center px-4 pt-1 select-none h-[44px]">
            <div className="flex-1 flex items-end gap-1 overflow-x-auto no-scrollbar h-full">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    "group relative flex items-center gap-3 px-6 h-[40px] cursor-pointer transition-all duration-200 text-[10px] font-bold uppercase tracking-widest min-w-[160px]",
                    activeTabId === tab.id 
                      ? "bg-white dark:bg-background text-primary rounded-t-lg z-10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-lg"
                  )}
                >
                  {activeTabId === tab.id && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-t-lg" />
                  )}
                  <FileText className={cn("h-3.5 w-3.5", activeTabId === tab.id ? "text-primary" : "opacity-40")} />
                  <span className="truncate max-w-[100px]">{tab.name}</span>
                  <X 
                    className={cn(
                      "h-3 w-3 hover:bg-muted rounded-full p-0.5 transition-all ml-auto",
                      tabs.length === 1 && !activeTab.content ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                    )} 
                    onClick={(e) => closeTab(tab.id, e)}
                  />
                </div>
              ))}
              <Button variant="ghost" size="icon" onClick={addTab} className="h-8 w-8 rounded-lg mb-1 ml-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>



        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden divide-x dark:divide-zinc-800 relative">
          <div className="flex-1 flex flex-col relative group">
            
            {/* Inline Ghost Text Overlay */}
            {inlineSuffix && (
              <div 
                className="absolute inset-0 pointer-events-none p-10 !text-lg font-medium leading-relaxed text-transparent whitespace-pre-wrap select-none z-20 overflow-hidden"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
              >
                {activeTab.content.substring(0, sourceTextareaRef.current?.selectionStart || activeTab.content.length)}
                <span className="text-muted-foreground/50 italic">
                  {inlineSuffix}
                </span>
                <span className="ml-2 text-[8px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded inline-flex items-center font-bold align-middle uppercase tracking-tighter border border-border/50">TAB</span>
              </div>
            )}

            <Textarea
              ref={sourceTextareaRef}
              placeholder="Type your content here..."
              className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 p-10 !text-lg font-medium leading-relaxed bg-background text-foreground/90 selection:bg-primary/20 tracking-tight"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
              value={activeTab.content}
              onChange={(e) => updateActiveContent(e.target.value)}
              onScroll={(e) => {
                const overlay = e.currentTarget.previousElementSibling as HTMLDivElement;
                if (overlay && inlineSuffix) {
                  overlay.scrollTop = e.currentTarget.scrollTop;
                  overlay.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  if (inlineSuffix) {
                    e.preventDefault()
                    acceptInlineSuggestion()
                  } else if (multiSuggestions.length > 0) {
                    e.preventDefault()
                    acceptSuggestion(multiSuggestions[0])
                  }
                }
              }}
            />
          </div>
          <div className="flex-1 flex flex-col relative">
            <Textarea
              readOnly
              placeholder="Real-time sanitization will appear here..."
              className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 p-10 !text-lg font-medium leading-relaxed bg-background text-foreground/90 selection:bg-primary/20 tracking-tight"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
              value={output}
            />
          </div>
        </div>

        {/* AI Loading Overlay */}
        {isAiLoading && (
          <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <Wand2 className="h-4 w-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-xs font-black uppercase tracking-[3px] text-primary animate-pulse">AI Refining Text</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1">Improving tone & sanitization...</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Status Bar */}
        <div className="bg-[#fcfcfc] dark:bg-[#0a0a0a] border-t px-6 py-3 flex items-center justify-between z-30">
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground leading-none">Words</span>
              <span className="text-xs font-bold mt-1 font-mono tracking-tighter">{stats.words}</span>
            </div>
            <Separator orientation="vertical" className="h-6 opacity-30" />
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground leading-none">Characters</span>
              <span className="text-xs font-bold mt-1 font-mono tracking-tighter">{stats.characters}</span>
            </div>
            <Separator orientation="vertical" className="h-6 opacity-30" />
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground leading-none">Paragraphs</span>
              <span className="text-xs font-bold mt-1 font-mono tracking-tighter">{stats.paragraphs}</span>
            </div>
            <Separator orientation="vertical" className="h-6 opacity-30" />
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground leading-none">White Space</span>
              <span className="text-xs font-bold mt-1 font-mono tracking-tighter">{stats.whitespace}</span>
            </div>
            <Separator orientation="vertical" className="h-6 opacity-30" />
            <div className="flex flex-col">
              <span className="text-sm text-red-500 leading-none">Flagged</span>
              <span className="text-xs font-bold mt-1 font-mono tracking-tighter text-red-500">{stats.flagged}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => updateActiveContent("")} className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors">
              <RotateCcw className="h-3.5 w-3.5 mr-2" /> Clear
            </Button>
            
            <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 px-4 text-[10px] font-bold uppercase tracking-wider border-zinc-200 dark:border-zinc-800 hover:bg-muted/50 transition-colors">
                  <Plus className="h-3.5 w-3.5 mr-2" /> Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[380px] p-6">
                <DialogHeader>
                  <DialogTitle className="text-sm font-black uppercase tracking-[2px] mb-4">Create New Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Banned Word</label>
                    <Input 
                      placeholder="e.g. google" 
                      className="h-10 text-xs font-medium" 
                      value={quickWord}
                      onChange={(e) => setQuickWord(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Sanitized Replacement</label>
                    <Input 
                      placeholder="e.g. goo-gle (optional)" 
                      className="h-10 text-xs font-medium font-mono" 
                      value={quickReplacement}
                      onChange={(e) => setQuickReplacement(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                    />
                  </div>
                  <Button onClick={handleQuickAdd} className="w-full h-11 text-xs font-black uppercase tracking-[1px] mt-2">
                    Add Workspace Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Separator orientation="vertical" className="h-8 mx-1 opacity-20" />

            {/* <Button 
              variant="outline"
              className="h-10 px-6 rounded-xl font-black uppercase tracking-wider text-[10px] border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all active:scale-95 group"
              onClick={handleAiRefine}
              disabled={!activeTab.content || isAiLoading}
            >
              <Wand2 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" /> AI Refine
            </Button> */}

            <Button 
              className="h-10 px-8 rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-lg shadow-primary/10 transition-all active:scale-95"
              onClick={() => {
                navigator.clipboard.writeText(output)
                toast({ title: "Copied to Clipboard" })
              }}
              disabled={!output}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy Result
            </Button>
          </div>
        </div>

        {found.length > 0 && (
          <div className="absolute right-8 bottom-24 max-w-[200px] flex flex-wrap gap-1.5 justify-end pointer-events-none opacity-40">
            {[...new Set(found)].slice(0, 5).map((word, i) => (
              <Badge key={i} variant="outline" className="text-[8px] font-black py-0.5 px-2 bg-background/80 border-red-200 text-red-500 uppercase">
                {word}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}