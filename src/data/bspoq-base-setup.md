# bspoq.ai – Voice‑Controlled Dashboard Blueprint (Compact, Single File)

## Goal
Next.js + TypeScript + Tailwind v4 dashboard with **persistent ElevenLabs voice agent state** and a **3‑layer data stack**:  
- **Relational:** Prisma → Postgres (Supabase in prod)  
- **Cache:** Redis for hot paths/session state  
- **Vector:** Qdrant for RAG/semantic recall

## Stack
Next.js 15+, React 18+, shadcn/ui, Lucide, Zustand, TanStack Query, NextAuth v5 (+ Prisma adapter), Prisma, Upstash Redis, Qdrant-JS (vector search), ElevenLabs WebRTC (primary) + REST/Realtime WS (fallback), Vercel AI SDK (SSE streaming), ESLint + Prettier.

## Environment Variables (.env.example)

bash
# ==== Core Application ====
NEXTAUTH_SECRET=your_nextauth_secret_here
DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=your_upstash_redis_url_here
QDRANT_URL=your_qdrant_url_here
QDRANT_API_KEY=your_qdrant_api_key_here

# ==== ElevenLabs Voice ====
# Core API key – for REST/WS APIs and minting WebRTC tokens
ELEVENLABS_API_KEY=your_secret_api_key_here

# Project or Agent ID (if using multi-agent/project setup)
ELEVENLABS_PROJECT_ID=your_project_or_agent_id_here

# Secret for signing short-lived WebRTC auth tokens
ELEVENLABS_RTC_AUTH_SECRET=some_random_server_secret

# Optional: Region for latency optimisation (match to Vercel Edge region)
ELEVENLABS_REGION=us-east  # or eu-west, etc.

# Transport mode for voice agent (webrtc | ws | rest)
VOICE_TRANSPORT=webrtc

# ==== AI Providers ====
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here


## Structure
src/
├─ app/(dashboard)/layout.tsx              # Persistent shell (voice state lives here)
├─ app/(dashboard)/{page.tsx,page 1,page 2,page 3}
├─ components/{sidebar.tsx,ui/}
├─ lib/{db.ts,redis.ts,qdrant.ts}
├─ store/                                  # Zustand
├─ data/                                   # JSON fixtures
└─ prisma/{schema.prisma,seed.ts}


## Install
bash
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --yes

npx shadcn@latest init
npx shadcn@latest add button card input

npm i lucide-react zustand @tanstack/react-query @prisma/client \
  @upstash/redis qdrant-js next-auth@beta @auth/prisma-adapter bcryptjs \
  zod ai openai

npm i -D prisma prettier prettier-plugin-tailwindcss \
  eslint-config-prettier @types/bcryptjs

npx prisma init --datasource-provider postgresql


## .env
env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
REDIS_URL="redis://:password@host:6379"
QDRANT_URL="https://your-qdrant-endpoint"
QDRANT_API_KEY="your_key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="secret"


## Prisma Schema (prisma/schema.prisma)
prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  image         String?
  passwordHash  String?
  role          Role     @default(USER)
  accounts      Account[]
  sessions      Session[]
  voiceSessions VoiceSession[]
  auditLogs     AuditLog[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model VoiceSession {
  id             String   @id @default(cuid())
  userId         String
  agentId        String
  conversationId String
  status         String
  lastMessageAt  DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  user User @relation(fields: [userId], references: [id])
}

model Insight {
  id        String   @id @default(cuid())
  userId    String
  source    String
  title     String
  payload   Json
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id])
}

model ChartConfig {
  id        String   @id @default(cuid())
  userId    String
  key       String
  config    Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user User @relation(fields: [userId], references: [id])
  @@unique([userId, key])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  event     String
  metadata  Json?
  createdAt DateTime @default(now())
  user User? @relation(fields: [userId], references: [id])
}

/* NextAuth v5 adapter models */
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id])
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user User @relation(fields: [userId], references: [id])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

enum Role { USER ADMIN }


### Run migrations
bash
npx prisma migrate dev --name init && npx prisma generate


## Seed (prisma/seed.ts)
ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bspoq.ai' }, update: {},
    create: { email: 'admin@bspoq.ai', name: 'Admin', role: 'ADMIN', passwordHash: await bcrypt.hash('change', 10) }
  })
  await prisma.chartConfig.upsert({
    where: { userId_key: { userId: admin.id, key: 'thd-daily' } }, update: {},
    create: { userId: admin.id, key: 'thd-daily', config: { threshold: 5, unit: '%' } }
  })
}
main().finally(() => prisma.$disconnect())


## Data Clients
ts
// lib/db.ts
import { PrismaClient } from '@prisma/client'
export const prisma = (globalThis as any).prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma

ts
// lib/redis.ts
import Redis from 'ioredis'
export const redis = new Redis(process.env.REDIS_URL!)

ts
// lib/qdrant.ts
import { QdrantClient } from 'qdrant-js'
export const qdrant = new QdrantClient({ url: process.env.QDRANT_URL!, apiKey: process.env.QDRANT_API_KEY! })
export async function ensureCollection(name='bspoq_insights', size=3072) {
  const list = await qdrant.getCollections()
  if (!list.collections?.some(c => c.name === name)) {
    await qdrant.createCollection(name, { vectors: { size, distance: 'Cosine' } })
  }
}


## Layout – Voice Persistence
tsx
// app/(dashboard)/layout.tsx
'use client'
import { Sidebar } from '@/components/sidebar'
import { createContext, useRef, useState, useEffect } from 'react'
export const VoiceContext = createContext<any>(null)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const [agentId, setAgentId] = useState<string|null>(null)
  const [conversationId, setConversationId] = useState<string|null>(null)

  useEffect(() => { (async () => { /* initialize ElevenLabs session via API */ })() }, [])

  return (
    <VoiceContext.Provider value={{ agentId, conversationId, audioRef }}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto"><div className="p-6">{children}</div></main>
      </div>
    </VoiceContext.Provider>
  )
}


## Cache + Vector Examples
ts
// getLatestInsights (Redis cached)
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
export async function getLatestInsights(userId: string) {
  const key = `insights:${userId}:latest`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  const rows = await prisma.insight.findMany({ where:{ userId }, orderBy:{ createdAt:'desc' }, take:20 })
  await redis.set(key, JSON.stringify(rows), 'EX', 60)
  return rows
}

ts
// indexInsightVector (Qdrant upsert)
import { qdrant, ensureCollection } from '@/lib/qdrant'
export async function indexInsightVector(id: string, vector: number[], payload: any) {
  await ensureCollection()
  await qdrant.upsert('bspoq_insights', { points: [{ id, vector, payload }] })
}


## Sidebar (client routing, DOM‑stable)
tsx
// components/sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const path = usePathname()
  const item = (href: string, label: string, key: string) => (
    <Link href={href} data-voice-target={`nav-${key}`} className={path===href?'active':''}>
      {label}
    </Link>
  )
  return (
    <nav data-voice-target="sidebar">
      {item('/squad','Squad','squad')}
      {item('/fixtures','Fixtures','fixtures')}
      {item('/tables','Tables','tables')}
    </nav>
  )
}


## Brand Tokens (optional)
css
:root {
  --wigan-burgundy:#862633;
  --wigan-white:#FFFFFF;
  --wigan-black:#15100C;
}


## Supabase Notes
Use Supabase Postgres for prod; keep Prisma as ORM. If enabling RLS, use a service‑role connection string **server‑side only** and define policies explicitly.

## CI/Health
bash
npx prisma validate && npx prisma migrate status


## Next Moves
Voice intent map, realtime feeds, insight pipeline (→ vector index → cached delivery), RBAC + audit views.

# Real‑Time Voice Transport: WebRTC vs ElevenLabs API (Drop‑In Guidance)

## TL;DR
- **WebRTC** = persistent, bidirectional, ultra‑low‑latency audio stream direct from the browser to ElevenLabs; enables **barge‑in**, partial ASR, and first‑audio <250 ms.
- **ElevenLabs API (REST/WS)** = request/response (REST) or streaming (WS) per turn; simpler, but higher perceived latency and less natural turn‑taking.

## When to use which
- **Prototype quickly / batch TTS** → ElevenLabs **REST** (one‑shot synthesis).
- **Interactive but OK with turn gaps** → ElevenLabs **Realtime WS**.
- **Boardroom‑grade, natural feel** → **WebRTC** (recommended for BSPQO Dashboards).

## Architecture impact (this blueprint)
1) **Browser ↔ ElevenLabs (WebRTC):**
   - Establish **RTCPeerConnection** using a short‑lived token from /api/voice/token (Edge runtime).
   - Stream mic audio **up**, receive AI TTS audio **down**; start playback on first chunk.
   - Support **barge‑in**: if the user speaks, pause/duck TTS and route speech to ASR immediately.

2) **Model/Text path (unchanged):**
   - Keep **SSE** token streaming for Claude/GPT responses via Vercel’s Edge/Node routes.
   - The voice agent can "quote" or summarise SSE tokens as it speaks, for ultra‑snappy UX.

3) **DOM Intent Bridge (unchanged, but benefits from WebRTC):**
   - The agent issues **allow‑listed intents** (e.g., SelectTab, Filter{k,v}, OpenModal, Highlight{id}).
   - Server validates intent; client applies patch. WebRTC simply makes it *feel* instantaneous.

## Implementation delta (copy‑paste into repo plan)
- **Add** /app/api/voice/token/route.ts → mints short‑lived WebRTC auth token.
- **Add** /lib/voice/webrtc.ts → wraps RTCPeerConnection, handles ICE, jitter buffer, and barge‑in.
- **Update** VoiceProvider in your persistent layout to initialise **once** and survive route changes.
- **Keep** your ElevenLabs REST/WS code path behind a feature flag (VOICE_TRANSPORT=webrtc|ws|rest) for quick fallback.

## Operational guidance
- **Regions**: co‑locate Edge routes and ElevenLabs region with the client’s geography.
- **SLAs**: target P95 first‑audio <250 ms, P95 tool call <1.5 s, P95 intent apply <120 ms.
- **Observability**: log VoiceTurn (asr_ms, tts_first_chunk_ms, barge_in_count), AgentToolCall, IntentApplied.

## Quick decision tree
- Need truly natural, interruptible conversation? → **WebRTC**.
- Need quick demo lift with few moving parts? → **Realtime WS**.
- Need offline audio assets (presentations, clips)? → **REST** TTS.