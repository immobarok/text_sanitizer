import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import "dotenv/config"

const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const words = [
"i work in other places besides fiverr", "visit my website for more details", "i will send files to your email",
"here's my personal contact", "here is my personal contact", "essay writing for students",
"fiverr review manipulation", "contact me outside fiverr", "heres my personal contact",
"unprofessional behavior", "increase fiverr ratings", "empty/partial delivery",
"let's move to whatsapp", "let us move to whatsapp", "let's move to telegram",
"let us move to telegram", "message me on whatsapp", "contact me on linkedin",
"research paper writing", "feedback manipulation", "lets move to whatsapp",
"lets move to telegram", "coursework assistance", "reach me on facebook",
"copyrighted material", "illegal transactions", "contact me directly",
"credit card details", "copyright violation", "plagiarized content",
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

async function main() {
  console.log(`Starting to add ${words.length} words...`)
  for (const word of words) {
    await prisma.bannedWord.upsert({
      where: { word: word.toLowerCase().trim() },
      update: { category: "general", severity: "MEDIUM" },
      create: {
        word: word.toLowerCase().trim(),
        category: "general",
        severity: "MEDIUM",
      },
    })
  }
  console.log("Done!")
  process.exit(0)
}

main()
