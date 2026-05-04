import { WordManager } from "@/components/word-manager";

export default function WordsPage() {
  return (
    <div className="space-y-8 container mx-auto my-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Word Manager</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Manage your banned words database. Add, remove, or bulk import prohibited terms.
        </p>
      </div>
      <WordManager />
    </div>
  )
}