import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sanitizeText } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, options = {} } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      )
    }

    const bannedWords = await prisma.bannedWord.findMany({
      where: { isActive: true },
      select: { word: true },
    })

    const wordList = bannedWords.map((w: any) => w.word)
    const result = sanitizeText(text, wordList, options)

    // Save log (truncate for storage)
    const maxLength = 5000
    const log = await prisma.sanitizationLog.create({
      data: {
        originalText: text.slice(0, maxLength),
        sanitizedText: result.sanitized.slice(0, maxLength),
        wordsFound: result.found.length,
        replacements: result.found,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        original: text,
        sanitized: result.sanitized,
        found: result.found,
        count: result.found.length,
        logId: log.id,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Sanitization failed" },
      { status: 500 }
    )
  }
}