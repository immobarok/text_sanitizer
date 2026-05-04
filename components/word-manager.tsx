"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Upload, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "./ui/use-toast"
import { Input } from "./ui/input"
import { SelectTrigger,SelectContent,SelectItem,SelectValue,Select} from "./ui/select"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"



interface BannedWord {
  id: string
  word: string
  category: string
  severity: string
  createdAt: string
}

const DEFAULT_WORDS = [
  "i work in other places besides fiverr", "visit my website for more details", "i will send files to your email",
  "here's my personal contact", "here is my personal contact", "essay writing for students",
  "fiverr review manipulation", "contact me outside fiverr", "heres my personal contact",
  "unprofessional behavior", "increase fiverr ratings", "empty/partial delivery",
  "let's move to whatsapp", "let us move to whatsapp", "let's move to telegram",
  "let us move to telegram", "message me on whatsapp", "contact me on linkedin",
  "research paper writing", "feedback manipulation", "lets move to whatsapp",
  "lets move to telegram", "coursework assistance", "reach me on facebook",
  "copyrighted material", "illegal transactions", "contact me directly",
  "cr   card details", "copyright violation", "plagiarized content",
  "homework assistance", "dm me on instagram", "email list selling",
  "outside of fiverr", "negative feedback", "pay me via paypal",
  "5-star guaranteed", "illegal services", "cracked software",
  "send me an email", "academic writing", "money laundering",
  "positive rating", "increase rating", "review exchange",
  "fake engagement", "assignment help", "boost my rating",
  "escort services", "sexual services", "data harvesting",
  "freelancer.com", "unprofessional", "contact number",
  "cryptocurrency", "stolen content", "fake documents",
  "identity theft", "western union", "wire transfer",
  "peopleperhour", "mother fucker", "mobile number",
  "bank transfer", "adult content", "black hat seo",
  "phone number", "off-platform", "bank account",
  "transferwise", "fake reviews", "rating boost",
  "motherfucker", "outlook mail", "paid reviews",
  "prostitution", "google meet", "credentials",
  "offplatform", "transaction", "credit card",
  "outsourcely", "stolen work", "bot traffic",
  "buy reviews", "sugar daddy", "counterfeit",
  "credential", "truelancer", "misleading",
  "plagiarism", "yahoo mail", "debit card",
  "copy-paste", "sugar baby", "ransomware",
  "messenger", "instagram", "99designs",
  "fivesquid", "freelance", "five star",
  "gift card", "black hat", "keylogger",
  "whatsapp", "facebook", "telegram",
  "facetime", "password", "off-site",
  "linkedin", "payoneer", "ethereum",
  "spamming", "phishing", "gambling",
  "onlyfans", "stripper", "cracking",
  "fake ids", "scraping", "purchase",
  "contact", "twitter", "outside",
  "discord", "address", "offsite",
  "invoice", "website", "payment",
  "cashapp", "bitcoin", "binance",
  "workana", "reviews", "bastard",
  "asshole", "dumbass", "betting",
  "camgirl", "hacking", "carding",
  "malware", "wechat", "signal",
  "direct", "google", "paypal",
  "stripe", "crypto", "upwork",
  "toptal", "review", "coupon",
  "hacked", "casino", "nudity",
  "hentai", "erotic", "trojan",
  "tiktok", "skype", "email",
  "slack", "viber", "phone",
  "money", "venmo", "offer",
  "bitch", "whore", "fraud",
  "gmail", "virus", "zoom",
  "mail", "line", "call",
  "link", "bank", "wise",
  "cash", "guru", "sell",
  "fuck", "shit", "slut",
  "scam", "fake", "porn",
  "ddos", "url", "pay",
  "buy", "xxx", "fb"
]

export function WordManager() {
  const [words, setWords] = useState<BannedWord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [newWord, setNewWord] = useState("")
  const [newCategory, setNewCategory] = useState("general")
  const [newSeverity, setNewSeverity] = useState("MEDIUM")
  const [bulkText, setBulkText] = useState("")
  const { toast } = useToast()

  const fetchWords = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (category !== "all") params.append("category", category)
    
    const res = await fetch(`/api/banned-words?${params}`)
    const data = await res.json()
    if (data.success) setWords(data.data)
    setLoading(false)
  }, [search, category])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  const handleAdd = async () => {
    if (!newWord.trim()) return
    const res = await fetch("/api/banned-words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words: [newWord], category: newCategory, severity: newSeverity }),
    })
    if (res.ok) {
      setNewWord("")
      fetchWords()
      toast({ title: "Added", description: "Word added to banned list" })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/banned-words?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      fetchWords()
      toast({ title: "Deleted", description: "Word removed from banned list" })
    }
  }

  const handleBulkImport = async () => {
    const words = bulkText.split("\n").map(w => w.trim()).filter(Boolean)
    if (!words.length) return
    
    const res = await fetch("/api/banned-words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words, category: newCategory, severity: newSeverity }),
    })
    if (res.ok) {
      setBulkText("")
      fetchWords()
      toast({ title: "Imported", description: `${words.length} words imported` })
    }
  }

  const handleImportDefaults = async () => {
    const res = await fetch("/api/banned-words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words: DEFAULT_WORDS, category: "general", severity: "HIGH" }),
    })
    if (res.ok) {
      fetchWords()
      toast({ title: "Imported", description: "Default word list imported" })
    }
  }

  const severityColors: Record<string, string> = {
    LOW: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    CRITICAL: "bg-red-500/10 text-red-600 border-red-500/20",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search words..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportDefaults}>
            <Upload className="h-4 w-4 mr-2" />
            Import Defaults
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Word
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Banned Words</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="platform">Platform</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={newSeverity} onValueChange={setNewSeverity}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Single Word</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter word or phrase..."
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <Button onClick={handleAdd}>Add</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Bulk Import (one per line)</Label>
                  <textarea
                    className="w-full min-h-[120px] p-3 rounded-md border bg-background text-sm resize-y"
                    placeholder="word one&#10;word two&#10;word three"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <Button onClick={handleBulkImport} className="w-full" variant="secondary">
                    <Upload className="h-4 w-4 mr-2" />
                    Import {bulkText.split("\n").filter(Boolean).length} Words
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Banned Words ({words.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : words.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No words found</div>
            ) : (
              <div className="space-y-2">
                {words.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">{word.word}</span>
                      <Badge variant="outline" className="text-xs">
                        {word.category}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${severityColors[word.severity]}`}>
                        {word.severity}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(word.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}