import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const words = await prisma.bannedWord.findMany({
      where: {
        isActive: true,
        ...(category && category !== "all" ? { category } : {}),
        ...(search ? { word: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: words })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch words" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { words, category = "general", severity = "MEDIUM", replacement = "[DASHED]", password } = body

    // Simple password check for database additions
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { success: false, error: "Words array is required" },
        { status: 400 }
      )
    }

    const created = await prisma.$transaction(
      words.map((word: string) =>
        prisma.bannedWord.upsert({
          where: { word: word.toLowerCase().trim() },
          update: { category, severity, replacement },
          create: {
            word: word.toLowerCase().trim(),
            replacement,
            category,
            severity,
          },
        })
      )
    )

    return NextResponse.json({ success: true, data: created })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to add words" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      )
    }

    await prisma.bannedWord.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete word" },
      { status: 500 }
    )
  }
}