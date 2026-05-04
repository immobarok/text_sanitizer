"use client"

import { useState } from "react"
import { Lock, Plus, Trash2, Database, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect } from "react"

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  const [word, setWord] = useState("")
  const [replacement, setReplacement] = useState("****")
  const [loading, setLoading] = useState(false)
  const [words, setWords] = useState<any[]>([])
  
  const { toast } = useToast()

  const fetchWords = async () => {
    try {
      const res = await fetch("/api/banned-words")
      const data = await res.json()
      if (data.success) {
        setWords(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch words")
    }
  }

  useEffect(() => {
    fetchWords()
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // We'll check the password during the first API call
    setIsAuthorized(true)
  }

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!word.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/banned-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: [word.trim()],
          replacement: replacement.trim(),
          password: password
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: "Word Added", description: `"${word}" added to official database.` })
        setWord("")
        setReplacement("****")
        fetchWords()
      } else {
        toast({ title: "Error", description: data.error || "Failed to add word", variant: "destructive" })
        if (data.error === "Unauthorized") setIsAuthorized(false)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add word", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/banned-words?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Deleted", description: "Word removed from database" })
        fetchWords()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete word", variant: "destructive" })
    }
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter password to manage official database words</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password..." 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">Unlock Panel</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-7 w-7 text-primary" />
            Database Manager
          </h1>
          <p className="text-muted-foreground">Manage official sanitization rules applied to all users</p>
        </div>
        <Button variant="outline" onClick={() => setIsAuthorized(false)}>Logout</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-2 h-fit sticky top-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Rule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddWord} className="space-y-4">
              <div className="space-y-2">
                <Label>Banned Word/Phrase</Label>
                <Input 
                  placeholder="e.g. badword" 
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Official Replacement</Label>
                <Input 
                  placeholder="e.g. [CENSORED]" 
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add to Database"}
              </Button>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                <p className="text-[10px] text-yellow-700">
                  Adding words here will apply them to every user instantly after they refresh.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Current Database Words
              <Badge variant="secondary">{words.length} Total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Replacement</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {words.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                        No official words found in database
                      </TableCell>
                    </TableRow>
                  ) : (
                    words.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.word}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">{item.replacement}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
