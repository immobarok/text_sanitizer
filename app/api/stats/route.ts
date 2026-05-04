import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [totalWords, totalLogs, recentLogs] = await Promise.all([
      prisma.bannedWord.count({ where: { isActive: true } }),
      prisma.sanitizationLog.count(),
      prisma.sanitizationLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          wordsFound: true,
          replacements: true,
          createdAt: true,
        },
      }),
    ])

    const totalFound = await prisma.sanitizationLog.aggregate({
      _sum: { wordsFound: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        totalWords,
        totalLogs,
        totalFound: totalFound._sum.wordsFound || 0,
        recentLogs,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}