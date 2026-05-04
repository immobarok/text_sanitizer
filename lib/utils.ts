import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface WordRule {
  word: string
  replacement: string
}

export function sanitizeText(
  text: string,
  bannedWords: WordRule[],
  options: { caseSensitive?: boolean; wholeWord?: boolean } = {}
): { sanitized: string; found: string[] } {
  let sanitized = text
  const found: string[] = []
  const flags = options.caseSensitive ? 'g' : 'gi'

  // Sort by word length descending to handle overlapping phrases
  const sortedWords = [...bannedWords].sort((a, b) => b.word.length - a.word.length)

  for (const rule of sortedWords) {
    const { word, replacement } = rule
    if (!word.trim()) continue
    
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = options.wholeWord 
      ? `\\b${escaped}\\b` 
      : escaped
    
    const regex = new RegExp(pattern, flags)
    
    if (regex.test(sanitized)) {
      found.push(word)
      sanitized = sanitized.replace(regex, (match) => {
        // Create the dashed version (e.g., google -> goo-gle)
        const parts = []
        for (let i = 0; i < match.length; i += 2) {
          parts.push(match.substring(i, i + 2))
        }
        return parts.join('-')
      })
    }
  }

  return { sanitized, found: [...new Set(found)] }
}